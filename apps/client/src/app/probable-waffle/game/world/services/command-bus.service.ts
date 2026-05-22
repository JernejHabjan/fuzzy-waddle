import { Subject, Subscription } from "rxjs";
import type { GameCommand, GameCommandInput } from "../../data/commands/game-command";
import { SimulationTickService } from "./simulation-tick.service";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { CommandBuffer } from "./command-buffer";
import { getCommunicator, hasMultiplayerCommandRelay } from "../../data/scene-data";
import {
  type PlayerNumber,
  ProbableWafflePlayerType,
  type ProbableWaffleReplayCommandBatch
} from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../../environments/environment";
import { getSceneService } from "./scene-component-helpers";
import { ActorIndexSystem } from "./ActorIndexSystem";
import { getActorComponent } from "../../data/actor-component";
import { OwnerComponent } from "../../entity/components/owner-component";

/**
 * Central command bus for all player- and AI-issued simulation commands.
 *
 * Single-player path: commands are stamped with the current tick and emitted
 * immediately on command$. No buffering or network I/O.
 *
 * Multiplayer path (activated by initMultiplayer()):
 *   1. dispatch() stamps the command for currentTick + INPUT_DELAY_TICKS (2),
 *      queues it in pendingOutbound, and does NOT emit yet.
 *   2. On each tick T, the bus sends pendingOutbound[T+2] over the socket
 *      (even if empty — this is the per-tick heartbeat peers need to advance).
 *   3. Incoming remote batches are buffered by (tick, playerNumber).
 *   4. Before advancing to tick T+1 the bus checks that all human players have
 *      committed for T+1. If not, SimulationTickService is stalled.
 *   5. Commands for the current tick are flushed to command$ in playerNumber
 *      order so every client applies them identically.
 *
 * Ownership validation (only issue commands for your own actors) is the
 * responsibility of callers. ActionSystem and MovementSystem trust the actorIds.
 */
export class CommandBusService {
  /** 2-tick delay = 100 ms window for commands to reach all peers before execution. */
  static readonly INPUT_DELAY_TICKS = 2;
  private static readonly STALL_LOG_DELAY_MS = 150;
  // Early startup ticks can briefly stall while first heartbeats converge; avoid noisy false alarms.
  private static readonly MIN_TICK_FOR_STALL_WARNING = CommandBusService.INPUT_DELAY_TICKS + 2;

  private readonly _command$ = new Subject<GameCommand>();
  readonly command$ = this._command$.asObservable();
  private readonly _commandBatch$ = new Subject<ProbableWaffleReplayCommandBatch>();
  readonly commandBatch$ = this._commandBatch$.asObservable();

  /** Injected after construction once SimulationTickService is registered. */
  tickService: SimulationTickService | null = null;

  private isMultiplayer = false;
  private humanPlayerNumbers: PlayerNumber[] = [];
  private localPlayerNumber: PlayerNumber | null = null;
  /** Outbound commands indexed by execution tick (currentTick + INPUT_DELAY). */
  private pendingOutbound = new Map<number, GameCommand[]>();
  private readonly buffer = new CommandBuffer();
  private readonly subscriptions: Subscription[] = [];
  private scene: ProbableWaffleScene | null = null;
  private readonly USE_DEBUG = false;
  private readonly debug = this.USE_DEBUG && !environment.production;
  private lastSentExecutionTick = 0;
  private stallSignature: string | null = null;
  private stallLogTimer: number | null = null;
  private pendingStallTick: number | null = null;
  private queuedWhileStalledSignature: string | null = null;
  private readonly lastReceivedTickByPlayer = new Map<PlayerNumber, number>();
  private lastSentTickByLocalPlayer: number | null = null;

  /**
   * Activates the multiplayer relay path.
   * Must be called after tickService is set and the communicator is ready.
   * Safe to call only in sessions where multiplayer command relay is available.
   */
  initMultiplayer(scene: ProbableWaffleScene): void {
    this.scene = scene;
    this.isMultiplayer = true;
    this.localPlayerNumber = this.resolveLocalPlayerNumber(scene);
    this.humanPlayerNumbers = scene.baseGameData.gameInstance.players
      .filter((p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human)
      .map((p) => p.playerNumber!);
    this.humanPlayerNumbers.sort((a, b) => a - b);
    if (this.localPlayerNumber === null) {
      console.error("[CommandBus] Could not resolve local player number. Local command batches cannot be sent.");
    } else if (!this.humanPlayerNumbers.includes(this.localPlayerNumber)) {
      console.error(
        `[CommandBus] Local player ${this.localPlayerNumber} is not part of human lockstep set [${this.humanPlayerNumbers.join(",") || "none"}].`
      );
    }

    this.debugLog(
      `init localPlayer=${this.localPlayerNumber ?? "none"} humans=${this.humanPlayerNumbers.join(",") || "none"}`
    );

    const communicator = getCommunicator(scene);
    const commandRelay = communicator.gameCommandChanged;
    if (!commandRelay || !hasMultiplayerCommandRelay(scene)) {
      this.debugLog("init skipped: multiplayer command relay is not available");
      this.isMultiplayer = false;
      return;
    }

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());

    // Receive remote command batches (including local player's server echo) and buffer them
    this.subscriptions.push(
      commandRelay.on.subscribe((event) => {
        if (event.rejectionReason && event.playerNumber === this.localPlayerNumber) {
          // The server rejected our batch (payload invalid) and relayed an empty one.
          // Log clearly so the developer can see what caused the desync.
          console.error(
            `[CommandBus] Server rejected batch for tick=${event.tick} player=${event.playerNumber}: ${event.rejectionReason}`
          );
        }
        if (event.commands.length > 0) {
          this.debugLog(
            `received batch tick=${event.tick} player=${event.playerNumber} commands=${event.commands.length} types=${this.describeCommandTypes(event.commands as GameCommand[])}`
          );
        } else {
          this.debugLog(`received heartbeat tick=${event.tick} player=${event.playerNumber}`);
        }
        this.lastReceivedTickByPlayer.set(event.playerNumber, event.tick);
        this.buffer.commit(event.tick, event.playerNumber, event.commands as GameCommand[]);
        this.emitRecordedBatch({
          tick: event.tick,
          playerNumber: event.playerNumber,
          commands: event.commands
        });
        this.tryUnblockTick();
      })
    );

    // Remove gracefully-leaving players from the lockstep blocking set so remaining
    // players are not stuck waiting for heartbeats that will never arrive.
    if (communicator.playerChanged) {
      this.subscriptions.push(
        communicator.playerChanged.on.subscribe((event) => {
          if (
            event.property === "left" &&
            event.data.playerControllerData?.playerDefinition?.player?.playerNumber !== undefined
          ) {
            this.removePlayerFromLockstep(
              event.data.playerControllerData.playerDefinition.player.playerNumber as PlayerNumber
            );
          }
        })
      );
    }

    // Hard disconnect path is broadcast on playerDisconnected; remove player from lockstep
    // when the server marks reconnect window as exhausted to prevent permanent stalls.
    if (communicator.playerDisconnected) {
      this.subscriptions.push(
        communicator.playerDisconnected.on.subscribe((event) => {
          if (event.reconnectWindowSeconds === 0) {
            this.removePlayerFromLockstep(event.playerNumber);
          }
        })
      );
    }

    // On every tick: flush commands, send outbound batch, gate next tick
    if (this.tickService) {
      this.tickService.pauseTick("lockstep");
      this.subscriptions.push(this.tickService.tick$.subscribe((tick) => this.onTick(tick)));
    }

    this.seedInitialTicks();
    this.tryUnblockTick();
  }

  dispatch(command: GameCommandInput): void {
    if (this.scene?.isSpectator || this.scene?.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }

    const normalizedCommand = this.normalizeCommand(command);
    if (!normalizedCommand) {
      return;
    }

    if (!this.isMultiplayer) {
      // Single-player: stamp and emit immediately
      const tick = this.tickService?.currentTick ?? 0;
      const stamped = { ...normalizedCommand, tick } as GameCommand;
      this.emitRecordedBatch({
        tick,
        playerNumber: stamped.playerNumber,
        commands: [stamped]
      });
      this._command$.next(stamped);
      return;
    }

    // Multiplayer: stamp with delay, but never target a batch tick that has already been sent.
    const requestedTick = (this.tickService?.currentTick ?? 0) + CommandBusService.INPUT_DELAY_TICKS;
    // Server echo is the source of truth for what it already accepted from us.
    // Never enqueue a command into a tick that is <= last acknowledged local tick.
    const acknowledgedLocalTick =
      this.localPlayerNumber !== null ? (this.lastReceivedTickByPlayer.get(this.localPlayerNumber) ?? -1) : -1;
    const tick = Math.max(requestedTick, this.lastSentExecutionTick + 1, acknowledgedLocalTick + 1);
    const stamped = { ...normalizedCommand, tick } as GameCommand;
    if (!this.pendingOutbound.has(tick)) {
      this.pendingOutbound.set(tick, []);
    }
    this.pendingOutbound.get(tick)!.push(stamped);
    this.debugLog(
      `queued command type=${normalizedCommand.type} executeTick=${tick} requestedTick=${requestedTick} player=${stamped.playerNumber} actors=${stamped.actorIds.length}`
    );
    this.logQueuedWhileStalled(normalizedCommand.type, tick, stamped.playerNumber);
  }

  /**
   * Tick pipeline for lockstep:
   * 1) flush current committed commands,
   * 2) send next authoritative local batch/heartbeat,
   * 3) pause if next tick is missing any human commits.
   *
   * Outbound tick selection is clamped against both local send cursor and
   * server-acknowledged local tick to prevent stale heartbeat ladders.
   */
  private onTick(tick: number): void {
    // 1. Flush commands committed for this tick to command$ (in playerNumber order)
    const commands = this.buffer.flush(tick);
    for (const cmd of commands) {
      this._command$.next(cmd);
    }

    // 2. Commit our own commands for the future tick and send them to peers
    //    (even if empty — this is the lockstep heartbeat).
    //    NOTE: We do NOT directly commit to the buffer here. The local player's batch
    //    is committed only when the server echoes it back via on.subscribe, which
    //    prevents desync if the server rejects the payload.
    // Keep outbound relay ticks monotonic even if local sim tick is temporarily behind
    // (startup races, reconnect correction, or snapshot catch-up). If we send an
    // older tick than one already accepted by the server, validator will reject it
    // as stale and keep us in a permanent one-step-behind loop.
    const requestedFutureTick = tick + CommandBusService.INPUT_DELAY_TICKS;
    // Clamp against both local send cursor and server-ack cursor to prevent
    // duplicate/stale heartbeats after reconnect/snapshot races.
    const acknowledgedLocalTick =
      this.localPlayerNumber !== null ? (this.lastReceivedTickByPlayer.get(this.localPlayerNumber) ?? -1) : -1;
    const futureTick = Math.max(requestedFutureTick, this.lastSentExecutionTick + 1, acknowledgedLocalTick + 1);
    const outbound = this.pendingOutbound.get(futureTick) ?? [];
    this.pendingOutbound.delete(futureTick);
    if (this.localPlayerNumber !== null) {
      this.lastSentExecutionTick = Math.max(this.lastSentExecutionTick, futureTick);
      this.lastSentTickByLocalPlayer = futureTick;
      if (outbound.length > 0) {
        this.debugLog(
          `sending batch tick=${futureTick} player=${this.localPlayerNumber} commands=${outbound.length} types=${this.describeCommandTypes(outbound)}`
        );
      } else {
        this.debugLog(`sending heartbeat tick=${futureTick} player=${this.localPlayerNumber}`);
      }
      this.sendCommandBatch(futureTick, outbound);
    }

    // 3. Gate the next tick: stall until all peers have committed for tick+1
    if (this.tickService && !this.hasAllForTick(tick + 1)) {
      this.scheduleStallLog(tick + 1);
      this.tickService.pauseTick("lockstep");
    }

    this.buffer.gc(tick);
  }

  private sendCommandBatch(tick: number, commands: GameCommand[]): void {
    if (!this.scene || this.localPlayerNumber === null) return;
    // Use sendToServer() instead of send() so the local buffer is NOT self-committed
    // before server validation. The local player's batch is committed only when the
    // server echoes it back (via on.subscribe below), preventing desync on rejection.
    const commandRelay = getCommunicator(this.scene).gameCommandChanged;
    if (!commandRelay) {
      return;
    }

    commandRelay.sendToServer({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: this.scene.userId,
      tick,
      playerNumber: this.localPlayerNumber,
      commands
    });
  }

  /** Unblocks the tick if the next tick's commands have now arrived. */
  private tryUnblockTick(): void {
    if (!this.tickService) return;
    const nextTick = this.tickService.currentTick + 1;
    if (this.hasAllForTick(nextTick)) {
      this.clearPendingStallLog();
      if (this.stallSignature !== null) {
        this.debugLog(`resume nextTick=${nextTick}`);
        this.stallSignature = null;
      }
      this.tickService.resumeTick("lockstep");
      this.queuedWhileStalledSignature = null;
    }
  }

  private hasAllForTick(tick: number): boolean {
    return this.buffer.hasAll(tick, this.humanPlayerNumbers);
  }

  private seedInitialTicks(): void {
    if (!this.scene || this.localPlayerNumber === null) {
      return;
    }

    for (let tick = 1; tick <= CommandBusService.INPUT_DELAY_TICKS; tick++) {
      // Directly commit empty batches for the initial grace ticks so the local
      // player's lockstep slots are filled before the server can echo back.
      // The server will echo these back too (and re-commit them), which is harmless
      // because buffer.commit() merges rather than replaces.
      this.buffer.commit(tick, this.localPlayerNumber, []);
      this.lastSentExecutionTick = Math.max(this.lastSentExecutionTick, tick);
      this.sendCommandBatch(tick, []);
    }
  }

  playReplayBatch(batch: ProbableWaffleReplayCommandBatch): void {
    const commands = batch.commands as GameCommand[];
    for (const command of commands) {
      this._command$.next(command);
    }
  }

  /**
   * Reinitializes lockstep buffers after host snapshot correction/reconnect.
   *
   * Baseline tick is chosen from the max of snapshot tick, server-acknowledged
   * local tick, and local command-tail tick so post-reset heartbeats do not
   * regress and get rejected as stale by the server.
   */
  resetAfterSnapshot(snapshotTick: number, commandTail: readonly ProbableWaffleReplayCommandBatch[] = []): void {
    this.buffer.clear();
    this.pendingOutbound.clear();
    this.clearPendingStallLog();
    this.stallSignature = null;
    // Snapshot tick can lag behind the server's already-accepted local batches.
    // If we blindly restart from snapshotTick+1 we can spam stale ticks after correction.
    // Use the highest known accepted local tick as the post-reset baseline.
    const acceptedLocalTick =
      this.localPlayerNumber !== null ? (this.lastReceivedTickByPlayer.get(this.localPlayerNumber) ?? snapshotTick) : snapshotTick;
    const localTailTick =
      this.localPlayerNumber !== null
        ? commandTail
            .filter((batch) => batch.playerNumber === this.localPlayerNumber)
            .reduce((maxTick, batch) => Math.max(maxTick, batch.tick), snapshotTick)
        : snapshotTick;
    const resetBaselineTick = Math.max(snapshotTick, acceptedLocalTick, localTailTick);
    this.lastSentExecutionTick = resetBaselineTick;

    if (this.localPlayerNumber !== null) {
      for (
        let tick = resetBaselineTick + 1;
        tick <= resetBaselineTick + CommandBusService.INPUT_DELAY_TICKS;
        tick++
      ) {
        // Same as seedInitialTicks: directly commit here so the barrier doesn't
        // stall before the server echo arrives.  Re-commit on echo is harmless.
        this.buffer.commit(tick, this.localPlayerNumber, []);
        this.lastSentExecutionTick = Math.max(this.lastSentExecutionTick, tick);
        this.sendCommandBatch(tick, []);
      }
    }

    for (const batch of [...commandTail].sort((a, b) => a.tick - b.tick || a.playerNumber - b.playerNumber)) {
      this.buffer.commit(batch.tick, batch.playerNumber, batch.commands as GameCommand[]);
    }

    this.tryUnblockTick();
  }

  private emitRecordedBatch(batch: ProbableWaffleReplayCommandBatch): void {
    this._commandBatch$.next({
      tick: batch.tick,
      playerNumber: batch.playerNumber,
      commands: structuredClone(batch.commands)
    });
  }

  /**
   * Removes a player from the blocking set used by the lockstep barrier.
   *
   * Call this when a player permanently leaves or is evicted — i.e., the server
   * broadcasts `player-disconnected` with reconnectWindowSeconds === 0, or a
   * graceful leave event is received for a human player.
   *
   * Removing a departed player prevents the lockstep from stalling indefinitely
   * while waiting for batches that will never arrive.
   */
  removePlayerFromLockstep(playerNumber: PlayerNumber): void {
    if (!this.isMultiplayer) {
      return;
    }
    const before = this.humanPlayerNumbers.length;
    this.humanPlayerNumbers = this.humanPlayerNumbers.filter((n) => n !== playerNumber);
    if (this.humanPlayerNumbers.length !== before) {
      this.debugLog(
        `removed player ${playerNumber} from lockstep set; remaining=${this.humanPlayerNumbers.join(",") || "none"}`
      );
      // Try to unblock any tick that was waiting only on this departed player.
      this.tryUnblockTick();
    }
  }

  destroy(): void {
    this.clearPendingStallLog();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this._commandBatch$.complete();
    this._command$.complete();
  }

  private debugLog(message: string): void {
    if (!this.debug) {
      return;
    }
    console.info(`[CommandBus] ${message}`);
  }

  private logStall(nextTick: number): void {
    const committed = this.buffer.getCommittedPlayers(nextTick);
    const missing = this.humanPlayerNumbers.filter((playerNumber) => !committed.includes(playerNumber));
    const pauseReasons = this.tickService?.getPauseReasons().join(",") || "none";
    const signature = `${nextTick}|${committed.join(",")}|${missing.join(",")}`;
    if (signature === this.stallSignature) {
      return;
    }
    this.stallSignature = signature;
    this.debugLog(
      `stall nextTick=${nextTick} committed=${committed.join(",") || "none"} missing=${missing.join(",") || "none"} pauses=${pauseReasons}`
    );
    const lastReceivedByPlayer = this.humanPlayerNumbers
      .map((playerNumber) => `${playerNumber}:${this.lastReceivedTickByPlayer.get(playerNumber) ?? "none"}`)
      .join(" ");
    const socketConnected = this.scene?.baseGameData.communicator.activeSocket
      ? ((this.scene.baseGameData.communicator.activeSocket as any).ioSocket?.connected ?? "unknown")
      : "no-socket";
    console.warn(
      `[CommandBus][STALL] nextTick=${nextTick} waitingForPlayers=${missing.join(",") || "none"} committedBy=${committed.join(",") || "none"} pauses=${pauseReasons} localPlayer=${this.localPlayerNumber ?? "none"} lastSentLocalTick=${this.lastSentTickByLocalPlayer ?? "none"} lastReceivedByPlayer={${lastReceivedByPlayer}} socketConnected=${socketConnected}`
    );
  }

  private scheduleStallLog(nextTick: number): void {
    if (nextTick < CommandBusService.MIN_TICK_FOR_STALL_WARNING) {
      return;
    }

    if (this.pendingStallTick === nextTick || this.stallSignature?.startsWith(`${nextTick}|`)) {
      return;
    }

    this.clearPendingStallLog();
    this.pendingStallTick = nextTick;
    this.stallLogTimer = window.setTimeout(() => {
      this.stallLogTimer = null;
      this.pendingStallTick = null;
      if (!this.tickService || this.hasAllForTick(nextTick)) {
        return;
      }
      this.logStall(nextTick);
    }, CommandBusService.STALL_LOG_DELAY_MS);
  }

  private clearPendingStallLog(): void {
    if (this.stallLogTimer !== null) {
      clearTimeout(this.stallLogTimer);
      this.stallLogTimer = null;
    }
    this.pendingStallTick = null;
  }

  private logQueuedWhileStalled(
    commandType: GameCommand["type"],
    executeTick: number,
    playerNumber: PlayerNumber
  ): void {
    if (!this.tickService || !this.tickService.getPauseReasons().includes("lockstep")) {
      return;
    }

    const blockedTick = this.tickService.currentTick + 1;
    const committed = this.buffer.getCommittedPlayers(blockedTick);
    const missing = this.humanPlayerNumbers.filter((humanPlayerNumber) => !committed.includes(humanPlayerNumber));
    if (missing.length === 0) {
      return;
    }

    const signature = `${commandType}|${executeTick}|${blockedTick}|${missing.join(",")}|${committed.join(",")}`;
    if (signature === this.queuedWhileStalledSignature) {
      return;
    }
    this.queuedWhileStalledSignature = signature;
    console.warn(
      `[CommandBus][QUEUE-WHILE-STALLED] command=${commandType} player=${playerNumber} executeTick=${executeTick} blockedTick=${blockedTick} missingPlayers=${missing.join(",")} committedPlayers=${committed.join(",") || "none"}`
    );
  }

  private resolveLocalPlayerNumber(scene: ProbableWaffleScene): PlayerNumber | null {
    const scenePlayerNumber = scene.playerOrNull?.playerNumber;
    if (scenePlayerNumber !== undefined && scenePlayerNumber !== null) {
      return scenePlayerNumber;
    }

    const basePlayerNumber = scene.baseGameData.user.playerNumber;
    if (basePlayerNumber !== undefined && basePlayerNumber !== null) {
      return basePlayerNumber;
    }

    const userId = scene.userId;
    if (userId) {
      const matchingPlayer = scene.baseGameData.gameInstance.players.find(
        (player) => player.playerController.data.userId === userId
      );
      if (matchingPlayer?.playerNumber !== undefined) {
        return matchingPlayer.playerNumber;
      }
    }

    return null;
  }

  private describeCommandTypes(commands: readonly GameCommand[]): string {
    return commands.map((command) => command.type).join(",");
  }

  private normalizeCommand(command: GameCommandInput): GameCommandInput | null {
    if (!this.scene) {
      return command;
    }

    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    if (!actorIndex) {
      return command;
    }

    const actorIds = [...new Set(command.actorIds)].filter((actorId) => {
      const actor = actorIndex.getActorById(actorId);
      const owner = actor ? getActorComponent(actor, OwnerComponent)?.getOwner() : undefined;
      return actor?.active && owner === command.playerNumber;
    });

    if (actorIds.length === 0) {
      this.debugLog(`dropping command type=${command.type} because no valid owned actors remained after sanitization`);
      return null;
    }

    if ("targetObjectIds" in command) {
      const targetObjectIds = command.targetObjectIds?.filter((targetId, index, ids) => {
        if (ids.indexOf(targetId) !== index) {
          return false;
        }
        return !!actorIndex.getActorById(targetId);
      });

      return {
        ...command,
        actorIds,
        targetObjectIds
      };
    }

    return {
      ...command,
      actorIds
    };
  }
}
