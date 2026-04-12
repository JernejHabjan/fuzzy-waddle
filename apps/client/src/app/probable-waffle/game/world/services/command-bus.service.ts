import { Subject, Subscription } from "rxjs";
import type { GameCommand, GameCommandInput } from "../../data/commands/game-command";
import { SimulationTickService } from "./simulation-tick.service";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { CommandBuffer } from "./command-buffer";
import { getCommunicator } from "../../data/scene-data";
import {
  ProbableWafflePlayerType,
  type PlayerNumber,
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
  private readonly debug = !environment.production;
  private lastSentExecutionTick = 0;
  private stallSignature: string | null = null;
  private stallLogTimer: number | null = null;
  private pendingStallTick: number | null = null;

  /**
   * Activates the multiplayer relay path.
   * Must be called after tickService is set and the communicator is ready.
   * Safe to call only in sessions where gameCommandChanged is defined.
   */
  initMultiplayer(scene: ProbableWaffleScene): void {
    this.scene = scene;
    this.isMultiplayer = true;
    this.localPlayerNumber = scene.playerOrNull?.playerNumber ?? scene.baseGameData.user.playerNumber ?? null;
    this.humanPlayerNumbers = scene.baseGameData.gameInstance.players
      .filter((p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human)
      .map((p) => p.playerNumber!);

    this.debugLog(
      `init localPlayer=${this.localPlayerNumber ?? "none"} humans=${this.humanPlayerNumbers.join(",") || "none"}`
    );

    const communicator = getCommunicator(scene);

    // Receive remote command batches and buffer them
    this.subscriptions.push(
      communicator.gameCommandChanged!.on.subscribe((event) => {
        if (event.commands.length > 0) {
          this.debugLog(
            `received batch tick=${event.tick} player=${event.playerNumber} commands=${event.commands.length} types=${this.describeCommandTypes(event.commands as GameCommand[])}`
          );
        }
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
          if (event.property === "left" && event.data.playerControllerData?.playerDefinition?.player?.playerNumber !== undefined) {
            this.removePlayerFromLockstep(
              event.data.playerControllerData.playerDefinition.player.playerNumber as PlayerNumber
            );
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
    const tick = Math.max(requestedTick, this.lastSentExecutionTick + 1);
    const stamped = { ...normalizedCommand, tick } as GameCommand;
    if (!this.pendingOutbound.has(tick)) {
      this.pendingOutbound.set(tick, []);
    }
    this.pendingOutbound.get(tick)!.push(stamped);
    this.debugLog(
      `queued command type=${normalizedCommand.type} executeTick=${tick} requestedTick=${requestedTick} player=${stamped.playerNumber} actors=${stamped.actorIds.length}`
    );
  }

  private onTick(tick: number): void {
    // 1. Flush commands committed for this tick to command$ (in playerNumber order)
    const commands = this.buffer.flush(tick);
    for (const cmd of commands) {
      this._command$.next(cmd);
    }

    // 2. Commit our own commands for the future tick and send them to peers
    //    (even if empty — this is the lockstep heartbeat)
    const futureTick = tick + CommandBusService.INPUT_DELAY_TICKS;
    const outbound = this.pendingOutbound.get(futureTick) ?? [];
    this.pendingOutbound.delete(futureTick);
    if (this.localPlayerNumber !== null) {
      this.lastSentExecutionTick = Math.max(this.lastSentExecutionTick, futureTick);
      this.emitRecordedBatch({
        tick: futureTick,
        playerNumber: this.localPlayerNumber,
        commands: outbound
      });
      if (outbound.length > 0) {
        this.debugLog(
          `sending batch tick=${futureTick} player=${this.localPlayerNumber} commands=${outbound.length} types=${this.describeCommandTypes(outbound)}`
        );
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
    getCommunicator(this.scene).gameCommandChanged!.send({
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
      this.buffer.commit(tick, this.localPlayerNumber, []);
      this.emitRecordedBatch({
        tick,
        playerNumber: this.localPlayerNumber,
        commands: []
      });
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

  bufferRemoteBatch(batch: ProbableWaffleReplayCommandBatch): void {
    this.buffer.commit(batch.tick, batch.playerNumber, batch.commands as GameCommand[]);
    this.tryUnblockTick();
  }

  resetAfterSnapshot(snapshotTick: number, commandTail: readonly ProbableWaffleReplayCommandBatch[] = []): void {
    this.buffer.clear();
    this.pendingOutbound.clear();
    this.clearPendingStallLog();
    this.stallSignature = null;
    this.lastSentExecutionTick = snapshotTick;

    if (this.localPlayerNumber !== null) {
      for (let tick = snapshotTick + 1; tick <= snapshotTick + CommandBusService.INPUT_DELAY_TICKS; tick++) {
        this.buffer.commit(tick, this.localPlayerNumber, []);
        this.emitRecordedBatch({
          tick,
          playerNumber: this.localPlayerNumber,
          commands: []
        });
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
      this.debugLog(`removed player ${playerNumber} from lockstep set; remaining=${this.humanPlayerNumbers.join(",") || "none"}`);
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
    const signature = `${nextTick}|${committed.join(",")}|${missing.join(",")}`;
    if (signature === this.stallSignature) {
      return;
    }
    this.stallSignature = signature;
    this.debugLog(
      `stall nextTick=${nextTick} committed=${committed.join(",") || "none"} missing=${missing.join(",") || "none"}`
    );
  }

  private scheduleStallLog(nextTick: number): void {
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
