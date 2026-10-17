import { resolveLocalPlayerNumber } from "./command-address-validation";
import { Subscription } from "rxjs";
import {
  type GameCommand,
  type GameCommandAuthorityState,
  type GameCommandOutcomeKind,
  type GameCommandOutcomeReason,
  ProbableWafflePlayer,
  ProbableWafflePlayerType,
  type ProbableWaffleReplayCommandBatch
} from "@fuzzy-waddle/probable-waffle-protocol";
import { type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { SimulationPauseReason, SimulationTickService } from "../simulation-tick.service";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { CommandBuffer } from "./command-buffer";
import { getCommunicator, hasMultiplayerCommandRelay } from "../../../data/scene-data";
import { getSceneService } from "../scene-component-helpers";

import { getPlayersFromScene } from "@fuzzy-waddle/platform-game-host/phaser/scene/base.scene";

import { CommandRelayDiagnostics } from "./command-relay-diagnostics";
import { sendCommandBatch } from "./send-command-batch";
/** Owns relay buffering, echo-gated application and snapshot heartbeat recovery. */
export class CommandLockstep {
  readonly diagnostics = new CommandRelayDiagnostics(this);
  /** The bus supplies application, replay recording and authority restore; this owner controls relay timing only. */
  constructor(
    readonly scene: ProbableWaffleScene,
    readonly emitForApplication: (command: GameCommand, index?: number) => void,
    readonly reportOutcome: (
      command: GameCommand,
      kind: GameCommandOutcomeKind,
      reason: GameCommandOutcomeReason,
      actors?: readonly string[],
      links?: readonly string[],
      detail?: string
    ) => void,
    readonly emitRecordedBatch: (batch: ProbableWaffleReplayCommandBatch) => void,
    readonly restoreAuthority: (state: GameCommandAuthorityState) => void
  ) {}

  /** Documents the following declaration and its compatibility contract. */
  static readonly INPUT_DELAY_TICKS = 2;

  static readonly PROCESSED_COMMAND_LIMIT = 2048;

  isMultiplayer = false;

  humanPlayerNumbers: PlayerNumber[] = [];

  localPlayerNumber: PlayerNumber | null = null;

  /** Documents the following declaration and its compatibility contract. */
  pendingOutbound = new Map<number, GameCommand[]>();

  readonly buffer = new CommandBuffer();

  readonly subscriptions: Subscription[] = [];

  readonly sentTransportSequenceByTick = new Map<number, number>();

  readonly sentCommandsByTick = new Map<number, GameCommand[]>();

  lastSentExecutionTick = 0;

  nextOutboundTransportSequence = 1;

  readonly lastReceivedTickByPlayer = new Map<PlayerNumber, number>();

  lastSentTickByLocalPlayer: number | null = null;

  tryInitMultiplayer(): void {
    // Activate the multiplayer relay path when a socket is present
    const humanPlayerCount = this.scene.baseGameData.gameInstance.players.filter(
      (player) => player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human
    ).length;
    if (hasMultiplayerCommandRelay(this.scene) && humanPlayerCount > 1) {
      this.initMultiplayer();
    }
  }

  /**
   * Activates the multiplayer relay path.
   * Must be called after tickService is set and the communicator is ready.
   * Safe to call only in sessions where multiplayer command relay is available.
   */
  initMultiplayer(): void {
    const scene = this.scene;
    this.isMultiplayer = true;
    this.localPlayerNumber = resolveLocalPlayerNumber(scene);
    this.humanPlayerNumbers = getPlayersFromScene<ProbableWafflePlayer>(scene)
      .filter((p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human)
      .map((p) => p.playerNumber!);
    this.humanPlayerNumbers.sort((a, b) => a - b);
    if (this.localPlayerNumber === null) {
      this.diagnostics.logger.error(
        "[CommandBus] " +
          this.diagnostics.getMultiplayerLogContext() +
          " Could not resolve local player number. Local command batches can" +
          "not be sent."
      );
    } else if (!this.humanPlayerNumbers.includes(this.localPlayerNumber)) {
      this.diagnostics.logger.error(
        "[CommandBus] " +
          this.diagnostics.getMultiplayerLogContext() +
          " Local player " +
          this.localPlayerNumber +
          " is not part of human lockstep set [" +
          (this.humanPlayerNumbers.join(",") || "none") +
          "]."
      );
    }

    this.diagnostics.debugLog(
      `init localPlayer=${this.localPlayerNumber ?? "none"} humans=${this.humanPlayerNumbers.join(",") || "none"}`
    );

    const communicator = getCommunicator(scene);
    const commandRelay = communicator.gameCommandChanged;
    if (!commandRelay || !hasMultiplayerCommandRelay(scene)) {
      this.diagnostics.debugLog("init skipped: multiplayer command relay is not available");
      this.isMultiplayer = false;
      return;
    }
    // Receive remote command batches (including local player's server echo) and buffer them
    this.subscriptions.push(
      commandRelay.on.subscribe((event) => {
        this.diagnostics.observeReceivedCommandEvent(event);
        if (event.rejectionReason && event.playerNumber === this.localPlayerNumber) {
          // The server rejected our batch (payload invalid) and relayed an empty one.
          // Log clearly so the developer can see what caused the desync.
          this.diagnostics.logger.error(
            "[CommandBus] " +
              this.diagnostics.getMultiplayerLogContext() +
              " Server rejected batch for tick=" +
              event.tick +
              " player=" +
              event.playerNumber +
              ": " +
              event.rejectionReason +
              " recentLocalTicks={" +
              this.diagnostics.describeRecentLocalTickTimeline() +
              "}"
          );
          for (const command of this.sentCommandsByTick.get(event.tick) ?? []) {
            this.reportOutcome(command, "rejected", "application_failed", command.actorIds, [], event.rejectionReason);
          }
        }
        if (event.playerNumber === this.localPlayerNumber) this.sentCommandsByTick.delete(event.tick);
        if (event.commands.length > 0) {
          this.diagnostics.debugLog(
            "received batch tick=" +
              event.tick +
              " player=" +
              event.playerNumber +
              " commands=" +
              event.commands.length +
              " types=" +
              this.diagnostics.describeCommandTypes(event.commands)
          );
        } else {
          this.diagnostics.debugLog(`received heartbeat tick=${event.tick} player=${event.playerNumber}`);
        }
        // Packet arrival order is diagnostic only. Buffer/received-tick state must
        // still follow authoritative accepted tick progress so one late empty
        // heartbeat cannot strand a permanent gap in lockstep.
        this.materializeAcceptedTickProgress(event.playerNumber, event.tick);
        this.buffer.commit(event.tick, event.playerNumber, event.commands);
        this.lastReceivedTickByPlayer.set(
          event.playerNumber,
          Math.max(this.lastReceivedTickByPlayer.get(event.playerNumber) ?? -1, event.tick)
        );
        if (event.playerNumber === this.localPlayerNumber) {
          this.diagnostics.recordLocalTickStage(
            event.tick,
            event.rejectionReason ? `echo-empty(${event.rejectionReason})` : `echo(${event.commands.length})`
          );
        }
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
      this.tickService.pauseTick(SimulationPauseReason.Lockstep);
      this.subscriptions.push(this.tickService.tick$.subscribe((tick) => this.onTick(tick)));
    }

    this.seedInitialTicks();
    this.tryUnblockTick();
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
  onTick(tick: number): void {
    // 1. Flush commands committed for this tick to command$ (in playerNumber order)
    const commands = this.buffer.flush(tick);
    for (const [index, cmd] of commands.entries()) {
      this.emitForApplication(cmd, index);
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
    const requestedFutureTick = tick + CommandLockstep.INPUT_DELAY_TICKS;
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
      this.diagnostics.recordLocalTickStage(
        futureTick,
        outbound.length > 0 ? `scheduled(${outbound.length})` : "scheduled(0)"
      );
      if (outbound.length === 0 && !this.buffer.hasPlayerCommit(futureTick, this.localPlayerNumber)) {
        // Empty heartbeats are the lockstep barrier token for this player's slot.
        // If we wait only for the server echo here, a later accepted heartbeat can
        // overtake an earlier empty one and leave the local buffer with a permanent
        // hole even though the server already advanced past that tick. Real command
        // batches still stay echo-gated so rejected gameplay payloads cannot self-commit.
        this.buffer.commit(futureTick, this.localPlayerNumber, []);
        this.diagnostics.recordLocalTickStage(futureTick, "local-heartbeat-commit");
      }
      if (outbound.length > 0) {
        this.diagnostics.debugLog(
          "sending batch tick=" +
            futureTick +
            " player=" +
            this.localPlayerNumber +
            " commands=" +
            outbound.length +
            " types=" +
            this.diagnostics.describeCommandTypes(outbound)
        );
      } else {
        this.diagnostics.debugLog(`sending heartbeat tick=${futureTick} player=${this.localPlayerNumber}`);
      }
      sendCommandBatch(this, futureTick, outbound, "steady-state-tick");
    }

    // 3. Gate the next tick: stall until all peers have committed for tick+1
    if (this.tickService && !this.hasAllForTick(tick + 1)) {
      this.diagnostics.scheduleStallLog(tick + 1);
      this.tickService.pauseTick(SimulationPauseReason.Lockstep);
    }

    this.buffer.gc(tick);
  }

  /** Documents the try unblock tick member and its declared contract at this boundary. */
  tryUnblockTick(): void {
    if (!this.tickService) return;
    const nextTick = this.tickService.currentTick + 1;
    if (this.hasAllForTick(nextTick)) {
      this.diagnostics.clearPendingStallLog();
      if (this.diagnostics.stallSignature !== null) {
        this.diagnostics.debugLog(`resume nextTick=${nextTick}`);
        this.diagnostics.stallSignature = null;
      }
      this.tickService.resumeTick(SimulationPauseReason.Lockstep);
      this.diagnostics.queuedWhileStalledSignature = null;
    }
  }

  hasAllForTick(tick: number): boolean {
    return this.buffer.hasAll(tick, this.humanPlayerNumbers);
  }

  /**
   * If we accept evidence that a remote player reached tick N, every earlier missing
   * tick for that same player must already be interpreted as an empty commit. Without
   * this receive-side repair, lastReceivedTickByPlayer can advance past a hole and
   * lockstep will then freeze forever on "not-committed-in-buffer-for-X".
   */
  materializeAcceptedTickProgress(playerNumber: PlayerNumber, receivedTick: number): void {
    const previousReceivedTick = this.lastReceivedTickByPlayer.get(playerNumber) ?? 0;
    if (receivedTick <= previousReceivedTick + 1) {
      return;
    }

    const filledTicks: number[] = [];
    for (let tick = previousReceivedTick + 1; tick < receivedTick; tick++) {
      if (this.buffer.hasPlayerCommit(tick, playerNumber)) {
        continue;
      }
      this.buffer.commit(tick, playerNumber, []);
      filledTicks.push(tick);
    }

    if (filledTicks.length === 0) {
      return;
    }
    const isStartupGap = filledTicks.every((tick) => tick <= CommandLockstep.INPUT_DELAY_TICKS);
    if (isStartupGap) {
      this.diagnostics.logger.warn(
        "[CommandBus][STARTUP-BACKFILL] " +
          this.diagnostics.getMultiplayerLogContext() +
          " player=" +
          playerNumber +
          " receivedTick=" +
          receivedTick +
          " filledTicks=" +
          filledTicks.join(",")
      );
      return;
    }

    this.diagnostics.logger.warn(
      "[CommandBus][REMOTE-GAP-FILL] " +
        this.diagnostics.getMultiplayerLogContext() +
        " player=" +
        playerNumber +
        " previousReceivedTick=" +
        previousReceivedTick +
        " receivedTick=" +
        receivedTick +
        " filledTicks=" +
        filledTicks.join(",")
    );
  }

  seedInitialTicks(): void {
    if (!this.scene || this.localPlayerNumber === null) {
      return;
    }

    for (let tick = 1; tick <= CommandLockstep.INPUT_DELAY_TICKS; tick++) {
      // Directly commit empty batches for the initial grace ticks so the local
      // player's lockstep slots are filled before the server can echo back.
      // The server will echo these back too (and re-commit them), which is harmless
      // because buffer.commit() merges rather than replaces.
      this.buffer.commit(tick, this.localPlayerNumber, []);
      this.diagnostics.recordLocalTickStage(tick, "seed-local-commit");
      this.lastSentExecutionTick = Math.max(this.lastSentExecutionTick, tick);
      sendCommandBatch(this, tick, [], "startup-seed");
    }
  }

  /**
   * Reinitializes lockstep buffers after host snapshot correction/reconnect.
   *
   * Baseline tick is chosen from the max of snapshot tick, server-acknowledged
   * local tick, and local command-tail tick so post-reset heartbeats do not
   * regress and get rejected as stale by the server.
   */
  resetAfterSnapshot(
    snapshotTick: number,
    commandTail: readonly ProbableWaffleReplayCommandBatch[] = [],
    authorityState?: GameCommandAuthorityState
  ): void {
    const preResetLastSentExecutionTick = this.lastSentExecutionTick;
    const commandTailLookup = new Set(commandTail.map((batch) => `${batch.tick}:${batch.playerNumber}`));
    this.buffer.clear();
    this.pendingOutbound.clear();
    this.sentTransportSequenceByTick.clear();
    this.sentCommandsByTick.clear();
    this.diagnostics.clearPendingStallLog();
    this.diagnostics.stallSignature = null;
    this.diagnostics.lastLoggedStallTick = null;
    if (authorityState) this.restoreAuthority(authorityState);
    // Snapshot tick can lag behind the server's already-accepted local batches.
    // If we blindly restart from snapshotTick+1 we can spam stale ticks after correction.
    // Use the highest known accepted local tick as the post-reset baseline.
    const acceptedLocalTick =
      this.localPlayerNumber !== null
        ? (this.lastReceivedTickByPlayer.get(this.localPlayerNumber) ?? snapshotTick)
        : snapshotTick;
    const localTailTick =
      this.localPlayerNumber !== null
        ? commandTail
            .filter((batch) => batch.playerNumber === this.localPlayerNumber)
            .reduce((maxTick, batch) => Math.max(maxTick, batch.tick), snapshotTick)
        : snapshotTick;
    // Snapshot correction can land after the steady-state sender already emitted
    // one or more future heartbeats. Keep that pre-reset frontier in the baseline
    // so recovery does not re-seed ticks the live sender already claimed.
    const resetBaselineTick = Math.max(snapshotTick, acceptedLocalTick, localTailTick, preResetLastSentExecutionTick);
    if (preResetLastSentExecutionTick > Math.max(snapshotTick, acceptedLocalTick, localTailTick)) {
      this.diagnostics.logger.warn(
        "[CommandBus][SNAPSHOT-RESET-CLAMP] " +
          this.diagnostics.getMultiplayerLogContext() +
          " snapshotTick=" +
          snapshotTick +
          " acceptedLocalTick=" +
          acceptedLocalTick +
          " localTailTick=" +
          localTailTick +
          " preResetLastSentTick=" +
          preResetLastSentExecutionTick +
          " resetBaselineTick=" +
          resetBaselineTick
      );
    }
    this.lastSentExecutionTick = resetBaselineTick;

    const restoredAcceptedSlots: string[] = [];
    for (const playerNumber of this.humanPlayerNumbers) {
      const acceptedTick = this.lastReceivedTickByPlayer.get(playerNumber) ?? snapshotTick;
      for (let tick = snapshotTick + 1; tick <= acceptedTick; tick++) {
        if (commandTailLookup.has(`${tick}:${playerNumber}`)) {
          continue;
        }
        // Snapshot replay tails can omit empty heartbeats even though lockstep had
        // already accepted them before the reset. Re-materialize those accepted
        // empty slots here so recovery cannot strand an old tick behind a sparse tail.
        this.buffer.commit(tick, playerNumber, []);
        if (playerNumber === this.localPlayerNumber) {
          this.diagnostics.recordLocalTickStage(tick, "snapshot-ack-backfill");
        }
        restoredAcceptedSlots.push(`${playerNumber}:${tick}`);
      }
    }
    if (restoredAcceptedSlots.length > 0) {
      this.diagnostics.logger.warn(
        "[CommandBus][SNAPSHOT-ACK-BACKFILL] " +
          this.diagnostics.getMultiplayerLogContext() +
          " snapshotTick=" +
          snapshotTick +
          " restored=" +
          restoredAcceptedSlots.join(",")
      );
    }

    if (this.localPlayerNumber !== null) {
      for (let tick = resetBaselineTick + 1; tick <= resetBaselineTick + CommandLockstep.INPUT_DELAY_TICKS; tick++) {
        // Same as seedInitialTicks: directly commit here so the barrier doesn't
        // stall before the server echo arrives.  Re-commit on echo is harmless.
        this.buffer.commit(tick, this.localPlayerNumber, []);
        this.diagnostics.recordLocalTickStage(tick, "snapshot-local-commit");
        this.lastSentExecutionTick = Math.max(this.lastSentExecutionTick, tick);
        sendCommandBatch(this, tick, [], "snapshot-reset");
      }
    }

    for (const batch of [...commandTail].sort((a, b) => a.tick - b.tick || a.playerNumber - b.playerNumber)) {
      this.buffer.commit(batch.tick, batch.playerNumber, batch.commands);
    }

    this.tryUnblockTick();
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
      this.diagnostics.debugLog(
        `removed player ${playerNumber} from lockstep set; remaining=${this.humanPlayerNumbers.join(",") || "none"}`
      );
      // Try to unblock any tick that was waiting only on this departed player.
      this.tryUnblockTick();
    }
  }

  get tickService(): SimulationTickService {
    return getSceneService(this.scene, SimulationTickService)!;
  }
  destroy(): void {
    this.diagnostics.clearPendingStallLog();
    this.sentCommandsByTick.clear();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
