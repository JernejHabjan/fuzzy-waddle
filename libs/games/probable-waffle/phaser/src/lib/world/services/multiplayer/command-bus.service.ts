import Phaser from "phaser";
import { Subject, Subscription } from "rxjs";
import {
  type GameCommand,
  type GameCommandAuthorityState,
  type GameCommandExecution,
  type GameCommandInput,
  type GameCommandOutcome,
  type GameCommandOutcomeKind,
  type GameCommandOutcomeReason,
  type ProbableWaffleGameCommandEvent,
  ProbableWaffleGameCommandTypes,
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
import { ActorIndexSystem } from "../ActorIndexSystem";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { isMultiplayerDebugEnabled } from "./multiplayer-debug";
import { createMultiplayerClientLogger } from "./multiplayer-client-logger";
import { getNgxSocketIoRawSocket } from "../../../core/ngx-socket-io-access";
import { getPlayersFromScene } from "@fuzzy-waddle/platform-game-host/phaser/scene/base.scene";
import {
  advanceProcessedCommandSequence,
  isProcessedCommandSequence
} from "./command-authority-policy";

/** Immediate result of admitting a command to the shared authority. */
export type GameCommandDispatchReceipt =
  | { readonly status: "dispatched"; readonly command: GameCommand }
  | { readonly status: "rejected"; readonly reason: GameCommandOutcomeReason };

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
 * Stage 3 additionally revalidates ownership/addressability at bus admission and
 * application, while actor-specific systems retain their capability/target checks.
 */
export class CommandBusService {
  /** Documents the following declaration and its compatibility contract. */
  static readonly INPUT_DELAY_TICKS = 2;
  private static readonly STALL_LOG_DELAY_MS = 150;
  // Early startup ticks can briefly stall while first heartbeats converge; avoid noisy false alarms.
  private static readonly MIN_TICK_FOR_STALL_WARNING = CommandBusService.INPUT_DELAY_TICKS + 2;

  private readonly _command$ = new Subject<GameCommand>();
  readonly command$ = this._command$.asObservable();
  private readonly _commandBatch$ = new Subject<ProbableWaffleReplayCommandBatch>();
  readonly commandBatch$ = this._commandBatch$.asObservable();
  private readonly _commandOutcome$ = new Subject<GameCommandOutcome>();
  readonly commandOutcome$ = this._commandOutcome$.asObservable();
  private static readonly PROCESSED_COMMAND_LIMIT = 2048;
  private static readonly OUTCOME_HISTORY_LIMIT = 512;
  private static readonly ACTIVE_AI_COMMAND_LIMIT = 128;

  private isMultiplayer = false;
  private humanPlayerNumbers: PlayerNumber[] = [];
  private localPlayerNumber: PlayerNumber | null = null;
  /** Documents the following declaration and its compatibility contract. */
  private pendingOutbound = new Map<number, GameCommand[]>();
  private readonly buffer = new CommandBuffer();
  private readonly subscriptions: Subscription[] = [];
  private readonly debug = isMultiplayerDebugEnabled();
  private readonly logger = createMultiplayerClientLogger("CommandBus");
  // Keep a short recent timeline of local tick lifecycle events so stale-heartbeat
  // and stall logs can show how a problematic tick moved through send/echo/commit.
  private readonly localTickTimeline = new Map<number, string[]>();
  private readonly remoteReceiveTimeline = new Map<PlayerNumber, string[]>();
  private readonly sentTransportSequenceByTick = new Map<number, number>();
  private readonly sentCommandsByTick = new Map<number, GameCommand[]>();
  private readonly lastReceivedRelaySequenceByPlayer = new Map<PlayerNumber, number>();
  private lastSentExecutionTick = 0;
  private nextOutboundTransportSequence = 1;
  private stallSignature: string | null = null;
  private stallLogTimer: number | null = null;
  private pendingStallTick: number | null = null;
  private queuedWhileStalledSignature: string | null = null;
  private readonly lastReceivedTickByPlayer = new Map<PlayerNumber, number>();
  private lastSentTickByLocalPlayer: number | null = null;
  private lastLoggedStallTick: number | null = null;
  private authorityEpoch = 0;
  private readonly nextSequenceByPlayer = new Map<PlayerNumber, number>();
  private readonly processedSequenceWatermarkByPlayer = new Map<PlayerNumber, number>();
  private readonly processedCommandIds = new Map<string, number>();
  private readonly activeCommitments = new Map<string, string>();
  private readonly expectedActorIdsByCommand = new Map<string, readonly string[]>();
  private readonly terminalActorIdsByCommand = new Map<string, Set<string>>();
  private readonly recentOutcomes: GameCommandOutcome[] = [];

  constructor(private readonly scene: ProbableWaffleScene) {
    // Scene shutdown must always own bus teardown, even if multiplayer init never runs
    // or fails partway through bootstrap. Otherwise old completed subjects and
    // subscriptions can leak across leave/re-enter cycles.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    const persisted = scene.baseGameData.gameInstance.gameState?.data.commandAuthority;
    if (persisted) this.restoreAuthorityState(persisted);
  }

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
  private initMultiplayer(): void {
    const scene = this.scene;
    this.isMultiplayer = true;
    this.localPlayerNumber = this.resolveLocalPlayerNumber(scene);
    this.humanPlayerNumbers = getPlayersFromScene<ProbableWafflePlayer>(scene)
      .filter((p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human)
      .map((p) => p.playerNumber!);
    this.humanPlayerNumbers.sort((a, b) => a - b);
    if (this.localPlayerNumber === null) {
      this.logger.error(
        `[CommandBus] ${this.getMultiplayerLogContext()} Could not resolve local player number. Local command batches cannot be sent.`
      );
    } else if (!this.humanPlayerNumbers.includes(this.localPlayerNumber)) {
      this.logger.error(
        `[CommandBus] ${this.getMultiplayerLogContext()} Local player ${this.localPlayerNumber} is not part of human lockstep set [${this.humanPlayerNumbers.join(",") || "none"}].`
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
    // Receive remote command batches (including local player's server echo) and buffer them
    this.subscriptions.push(
      commandRelay.on.subscribe((event) => {
        this.observeReceivedCommandEvent(event);
        if (event.rejectionReason && event.playerNumber === this.localPlayerNumber) {
          // The server rejected our batch (payload invalid) and relayed an empty one.
          // Log clearly so the developer can see what caused the desync.
          this.logger.error(
            `[CommandBus] ${this.getMultiplayerLogContext()} Server rejected batch for tick=${event.tick} player=${event.playerNumber}: ${event.rejectionReason} recentLocalTicks={${this.describeRecentLocalTickTimeline()}}`
          );
          for (const command of this.sentCommandsByTick.get(event.tick) ?? []) {
            this.reportOutcome(command, "rejected", "application_failed", command.actorIds, [], event.rejectionReason);
          }
        }
        if (event.playerNumber === this.localPlayerNumber) this.sentCommandsByTick.delete(event.tick);
        if (event.commands.length > 0) {
          this.debugLog(
            `received batch tick=${event.tick} player=${event.playerNumber} commands=${event.commands.length} types=${this.describeCommandTypes(event.commands)}`
          );
        } else {
          this.debugLog(`received heartbeat tick=${event.tick} player=${event.playerNumber}`);
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
          this.recordLocalTickStage(
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

  dispatch(command: GameCommandInput): GameCommandDispatchReceipt {
    if (this.scene?.isSpectator || this.scene?.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return { status: "rejected", reason: "application_failed" };
    }

    const inputError = this.getInputAddressError(command);
    if (inputError) {
      const rejected = this.stampCommand({ ...command, actorIds: [...new Set(command.actorIds)] }, this.tickService?.currentTick ?? 0);
      this.reportOutcome(rejected, "rejected", inputError);
      return { status: "rejected", reason: inputError };
    }

    const normalizedCommand = this.normalizeCommand(command);
    if (!normalizedCommand) {
      return { status: "rejected", reason: "invalid_owner" };
    }

    if (!this.isMultiplayer) {
      // Single-player: stamp and emit immediately
      const tick = this.tickService?.currentTick ?? 0;
      const stamped = this.stampCommand(normalizedCommand, tick);
      this.emitRecordedBatch({
        tick,
        playerNumber: stamped.playerNumber,
        commands: [stamped]
      });
      this.reportOutcome(stamped, "dispatched", "accepted_for_dispatch");
      this.emitForApplication(stamped);
      return { status: "dispatched", command: stamped };
    }

    // Multiplayer: stamp with delay, but never target a batch tick that has already been sent.
    const requestedTick = (this.tickService?.currentTick ?? 0) + CommandBusService.INPUT_DELAY_TICKS;
    // Server echo is the source of truth for what it already accepted from us.
    // Never enqueue a command into a tick that is <= last acknowledged local tick.
    const acknowledgedLocalTick =
      this.localPlayerNumber !== null ? (this.lastReceivedTickByPlayer.get(this.localPlayerNumber) ?? -1) : -1;
    const tick = Math.max(requestedTick, this.lastSentExecutionTick + 1, acknowledgedLocalTick + 1);
    const stamped = this.stampCommand(normalizedCommand, tick);
    if (!this.pendingOutbound.has(tick)) {
      this.pendingOutbound.set(tick, []);
    }
    this.pendingOutbound.get(tick)!.push(stamped);
    this.debugLog(
      `queued command type=${normalizedCommand.type} executeTick=${tick} requestedTick=${requestedTick} player=${stamped.playerNumber} actors=${stamped.actorIds.length}`
    );
    this.logQueuedWhileStalled(normalizedCommand.type, tick, stamped.playerNumber);
    this.reportOutcome(stamped, "dispatched", "accepted_for_dispatch");
    return { status: "dispatched", command: stamped };
  }

  /** Documents the dispatch deterministic member and its declared contract at this boundary. */
  dispatchDeterministic(command: GameCommandInput): GameCommandDispatchReceipt {
    const tick = this.tickService?.currentTick ?? 0;
    const inputError = this.getInputAddressError(command);
    if (inputError) {
      const rejected = this.stampCommand({ ...command, actorIds: [...new Set(command.actorIds)] }, tick);
      this.reportOutcome(rejected, "rejected", inputError);
      return { status: "rejected", reason: inputError };
    }
    const normalized = this.normalizeCommand(command);
    if (!normalized) return { status: "rejected", reason: "invalid_owner" };
    const stamped = this.stampCommand(normalized, tick);
    this.reportOutcome(stamped, "dispatched", "accepted_for_dispatch");
    this.emitForApplication(stamped);
    return { status: "dispatched", command: stamped };
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
      this.recordLocalTickStage(futureTick, outbound.length > 0 ? `scheduled(${outbound.length})` : "scheduled(0)");
      if (outbound.length === 0 && !this.buffer.hasPlayerCommit(futureTick, this.localPlayerNumber)) {
        // Empty heartbeats are the lockstep barrier token for this player's slot.
        // If we wait only for the server echo here, a later accepted heartbeat can
        // overtake an earlier empty one and leave the local buffer with a permanent
        // hole even though the server already advanced past that tick. Real command
        // batches still stay echo-gated so rejected gameplay payloads cannot self-commit.
        this.buffer.commit(futureTick, this.localPlayerNumber, []);
        this.recordLocalTickStage(futureTick, "local-heartbeat-commit");
      }
      if (outbound.length > 0) {
        this.debugLog(
          `sending batch tick=${futureTick} player=${this.localPlayerNumber} commands=${outbound.length} types=${this.describeCommandTypes(outbound)}`
        );
      } else {
        this.debugLog(`sending heartbeat tick=${futureTick} player=${this.localPlayerNumber}`);
      }
      this.sendCommandBatch(futureTick, outbound, "steady-state-tick");
    }

    // 3. Gate the next tick: stall until all peers have committed for tick+1
    if (this.tickService && !this.hasAllForTick(tick + 1)) {
      this.scheduleStallLog(tick + 1);
      this.tickService.pauseTick(SimulationPauseReason.Lockstep);
    }

    this.buffer.gc(tick);
  }

  /**
   * Batches commands for one authoritative simulation tick, normalizes ordering, and sends a single transport payload.
   * It preserves lockstep ordering and avoids exposing partially queued local commands as if they were confirmed world mutations.
   */
  private sendCommandBatch(
    tick: number,
    commands: GameCommand[],
    source: "startup-seed" | "steady-state-tick" | "snapshot-reset"
  ): void {
    if (!this.scene || this.localPlayerNumber === null) return;
    // Use sendToServer() instead of send() so the local buffer is NOT self-committed
    // before server validation. The local player's batch is committed only when the
    // server echoes it back (via on.subscribe below), preventing desync on rejection.
    const commandRelay = getCommunicator(this.scene).gameCommandChanged;
    if (!commandRelay) {
      return;
    }
    const acknowledgedLocalTick = this.lastReceivedTickByPlayer.get(this.localPlayerNumber) ?? -1;
    const existingSequence = this.sentTransportSequenceByTick.get(tick);
    if (existingSequence !== undefined) {
      // Ordering diagnostics must never become the authority that suppresses a
      // heartbeat. onTick() advances lastSentExecutionTick before we get here,
      // so dropping the send would create a real outbound hole and freeze peers.
      this.logger.warn(
        `[CommandBus][DUPLICATE-LOCAL-SEND] ${this.getMultiplayerLogContext()} source=${source} tick=${tick} commands=${commands.length} existingClientSequence=${existingSequence} recentLocalTicks={${this.describeRecentLocalTickTimeline()}}`
      );
    }
    const clientSequence = this.nextOutboundTransportSequence++;
    this.sentTransportSequenceByTick.set(tick, clientSequence);
    this.sentCommandsByTick.set(tick, commands.map((command) => structuredClone(command)));
    while (this.sentCommandsByTick.size > CommandBusService.PROCESSED_COMMAND_LIMIT) {
      const oldestTick = this.sentCommandsByTick.keys().next().value as number | undefined;
      if (oldestTick === undefined) break;
      this.sentCommandsByTick.delete(oldestTick);
    }
    this.recordLocalTickStage(tick, `${source}:${commands.length > 0 ? "send-batch" : "send-heartbeat"}`);
    this.recordLocalTickStage(tick, `client-seq(${clientSequence})`);
    if (tick <= acknowledgedLocalTick) {
      // Older-than-ack sends are the clearest signal that a recovery/startup path
      // emitted a heartbeat after the server had already accepted a newer local tick.
      this.recordLocalTickStage(tick, `late-vs-ack(${acknowledgedLocalTick})`);
      this.logger.warn(
        `[CommandBus][LATE-LOCAL-SEND] ${this.getMultiplayerLogContext()} source=${source} tick=${tick} acknowledgedLocalTick=${acknowledgedLocalTick} lastSentExecutionTick=${this.lastSentExecutionTick} commands=${commands.length} recentLocalTicks={${this.describeRecentLocalTickTimeline()}}`
      );
    } else {
      this.debugLog(
        `emit source=${source} tick=${tick} acknowledgedLocalTick=${acknowledgedLocalTick} lastSentExecutionTick=${this.lastSentExecutionTick} commands=${commands.length}`
      );
    }

    commandRelay.sendToServer({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: this.scene.userId,
      tick,
      playerNumber: this.localPlayerNumber,
      commands,
      transportMeta: {
        clientSequence,
        clientSentAtWallTimeMs: Date.now(),
        clientObservedTick: this.tickService?.currentTick ?? 0,
        clientAcknowledgedLocalTick: acknowledgedLocalTick,
        clientSource: source
      }
    });
  }

  /** Documents the try unblock tick member and its declared contract at this boundary. */
  private tryUnblockTick(): void {
    if (!this.tickService) return;
    const nextTick = this.tickService.currentTick + 1;
    if (this.hasAllForTick(nextTick)) {
      this.clearPendingStallLog();
      if (this.stallSignature !== null) {
        this.debugLog(`resume nextTick=${nextTick}`);
        this.stallSignature = null;
      }
      this.tickService.resumeTick(SimulationPauseReason.Lockstep);
      this.queuedWhileStalledSignature = null;
    }
  }

  private hasAllForTick(tick: number): boolean {
    return this.buffer.hasAll(tick, this.humanPlayerNumbers);
  }

  /**
   * If we accept evidence that a remote player reached tick N, every earlier missing
   * tick for that same player must already be interpreted as an empty commit. Without
   * this receive-side repair, lastReceivedTickByPlayer can advance past a hole and
   * lockstep will then freeze forever on "not-committed-in-buffer-for-X".
   */
  private materializeAcceptedTickProgress(playerNumber: PlayerNumber, receivedTick: number): void {
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
    const isStartupGap = filledTicks.every((tick) => tick <= CommandBusService.INPUT_DELAY_TICKS);
    if (isStartupGap) {
      this.logger.warn(
        `[CommandBus][STARTUP-BACKFILL] ${this.getMultiplayerLogContext()} player=${playerNumber} receivedTick=${receivedTick} filledTicks=${filledTicks.join(",")}`
      );
      return;
    }

    this.logger.warn(
      `[CommandBus][REMOTE-GAP-FILL] ${this.getMultiplayerLogContext()} player=${playerNumber} previousReceivedTick=${previousReceivedTick} receivedTick=${receivedTick} filledTicks=${filledTicks.join(",")}`
    );
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
      this.recordLocalTickStage(tick, "seed-local-commit");
      this.lastSentExecutionTick = Math.max(this.lastSentExecutionTick, tick);
      this.sendCommandBatch(tick, [], "startup-seed");
    }
  }

  playReplayBatch(batch: ProbableWaffleReplayCommandBatch): void {
    for (const [index, command] of batch.commands.entries()) {
      this.emitForApplication(this.upgradeLegacyCommand(command, batch.playerNumber, index));
    }
  }

  /**
   * Publishes a world-application result for AI reconciliation, replay diagnostics,
   * and the debug workbench. Callers report the first terminal reason instead of
   * silently returning from an invalid command.
   */
  reportOutcome(
    command: GameCommand,
    kind: GameCommandOutcomeKind,
    reason: GameCommandOutcomeReason,
    actorIds: readonly string[] = command.actorIds,
    worldLinkIds: readonly string[] = [],
    detail?: string
  ): void {
    const execution = command.execution;
    if (!execution) return;
    const observedTick =
      kind === "dispatched" ? command.tick : (this.tickService?.currentTick ?? command.tick);
    this.reportPersistedOutcome({
      schemaVersion: 1,
      kind,
      reason,
      tick: observedTick,
      playerNumber: command.playerNumber,
      commandId: execution.commandId,
      commitmentKey: execution.commitmentKey,
      authorityEpoch: execution.authorityEpoch,
      sequence: execution.sequence,
      ...(execution.intentId ? { intentId: execution.intentId } : {}),
      ...(execution.effectId ? { effectId: execution.effectId } : {}),
      actorIds: [...actorIds].sort(),
      worldLinkIds: [...worldLinkIds].sort(),
      ...(detail ? { detail } : {})
    });
  }

  /** Publishes a completion whose originating command is represented by saved effect metadata. */
  reportPersistedOutcome(outcome: GameCommandOutcome): void {
    if (
      outcome.kind === "completed" ||
      outcome.kind === "rejected" ||
      outcome.kind === "cancelled" ||
      outcome.kind === "failed"
    ) {
      if (
        outcome.reason !== "duplicate_command" &&
        outcome.reason !== "lost_outcome" &&
        outcome.reason !== "outcome_backlog_overflow" &&
        this.activeCommitments.get(outcome.commitmentKey) === outcome.commandId
      ) {
        const terminalActorIds = this.terminalActorIdsByCommand.get(outcome.commandId) ?? new Set<string>();
        outcome.actorIds.forEach((actorId) => terminalActorIds.add(actorId));
        this.terminalActorIdsByCommand.set(outcome.commandId, terminalActorIds);
        const expectedActorIds = this.expectedActorIdsByCommand.get(outcome.commandId) ?? outcome.actorIds;
        const settled =
          expectedActorIds.length === 0 || expectedActorIds.every((actorId) => terminalActorIds.has(actorId));
        if (settled && this.activeCommitments.get(outcome.commitmentKey) === outcome.commandId) {
          this.activeCommitments.delete(outcome.commitmentKey);
          this.expectedActorIdsByCommand.delete(outcome.commandId);
          this.terminalActorIdsByCommand.delete(outcome.commandId);
        }
      }
    }
    this.recentOutcomes.push(outcome);
    if (this.recentOutcomes.length > CommandBusService.OUTCOME_HISTORY_LIMIT) {
      this.recentOutcomes.splice(0, this.recentOutcomes.length - CommandBusService.OUTCOME_HISTORY_LIMIT);
    }
    this._commandOutcome$.next(outcome);
  }

  /** Snapshot of the bounded authority frontier persisted by saves and reconnects. */
  getAuthorityState(): GameCommandAuthorityState {
    const nextSequenceByPlayer: Record<number, number> = {};
    for (const [playerNumber, sequence] of [...this.nextSequenceByPlayer.entries()].sort(
      ([left], [right]) => left - right
    )) {
      nextSequenceByPlayer[playerNumber] = sequence;
    }
    const processedSequenceWatermarkByPlayer: Record<number, number> = {};
    for (const [playerNumber, sequence] of [...this.processedSequenceWatermarkByPlayer.entries()].sort(
      ([left], [right]) => left - right
    )) {
      processedSequenceWatermarkByPlayer[playerNumber] = sequence;
    }
    return {
      schemaVersion: 1,
      authorityEpoch: this.authorityEpoch,
      nextSequenceByPlayer,
      processedSequenceWatermarkByPlayer,
      processedCommandIds: [...this.processedCommandIds.keys()],
      activeCommitments: Object.fromEntries(
        [...this.activeCommitments.entries()].sort(([left], [right]) => left.localeCompare(right))
      ),
      activeCommandProgress: Object.fromEntries(
        [...this.expectedActorIdsByCommand.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([commandId, expectedActorIds]) => [
            commandId,
            {
              expectedActorIds: [...expectedActorIds].sort(),
              terminalActorIds: [...(this.terminalActorIdsByCommand.get(commandId) ?? [])].sort()
            }
          ])
      ),
      outcomes: structuredClone(this.recentOutcomes)
    };
  }

  /**
   * Advances the host fence. Late events from older hosts remain observable as
   * stable rejections but can no longer mutate the world.
   */
  advanceAuthorityEpoch(nextEpoch: number): void {
    if (!Number.isSafeInteger(nextEpoch) || nextEpoch <= this.authorityEpoch) return;
    this.authorityEpoch = nextEpoch;
    this.processedCommandIds.clear();
    this.processedSequenceWatermarkByPlayer.clear();
    this.activeCommitments.clear();
    this.expectedActorIdsByCommand.clear();
    this.terminalActorIdsByCommand.clear();
    this.pendingOutbound.clear();
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
    this.clearPendingStallLog();
    this.stallSignature = null;
    this.lastLoggedStallTick = null;
    if (authorityState) this.restoreAuthorityState(authorityState);
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
      this.logger.warn(
        `[CommandBus][SNAPSHOT-RESET-CLAMP] ${this.getMultiplayerLogContext()} snapshotTick=${snapshotTick} acceptedLocalTick=${acceptedLocalTick} localTailTick=${localTailTick} preResetLastSentTick=${preResetLastSentExecutionTick} resetBaselineTick=${resetBaselineTick}`
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
          this.recordLocalTickStage(tick, "snapshot-ack-backfill");
        }
        restoredAcceptedSlots.push(`${playerNumber}:${tick}`);
      }
    }
    if (restoredAcceptedSlots.length > 0) {
      this.logger.warn(
        `[CommandBus][SNAPSHOT-ACK-BACKFILL] ${this.getMultiplayerLogContext()} snapshotTick=${snapshotTick} restored=${restoredAcceptedSlots.join(",")}`
      );
    }

    if (this.localPlayerNumber !== null) {
      for (let tick = resetBaselineTick + 1; tick <= resetBaselineTick + CommandBusService.INPUT_DELAY_TICKS; tick++) {
        // Same as seedInitialTicks: directly commit here so the barrier doesn't
        // stall before the server echo arrives.  Re-commit on echo is harmless.
        this.buffer.commit(tick, this.localPlayerNumber, []);
        this.recordLocalTickStage(tick, "snapshot-local-commit");
        this.lastSentExecutionTick = Math.max(this.lastSentExecutionTick, tick);
        this.sendCommandBatch(tick, [], "snapshot-reset");
      }
    }

    for (const batch of [...commandTail].sort((a, b) => a.tick - b.tick || a.playerNumber - b.playerNumber)) {
      this.buffer.commit(batch.tick, batch.playerNumber, batch.commands);
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

  private stampCommand(command: GameCommandInput, tick: number): GameCommand {
    const supplied = command.execution;
    const sequence = supplied?.sequence ?? this.allocateSequence(command.playerNumber);
    const authorityEpoch = supplied?.authorityEpoch ?? this.authorityEpoch;
    const commandId = supplied?.commandId ?? `${command.playerNumber}:${authorityEpoch}:${sequence}:${this.scene.gameInstanceId}`;
    const source = supplied?.source ?? this.inferSource(command.playerNumber);
    const execution: GameCommandExecution = {
      schemaVersion: 1,
      commandId,
      commitmentKey: supplied?.commitmentKey ?? this.defaultCommitmentKey(command, commandId),
      source,
      authorityEpoch,
      sequence,
      ...(supplied?.intentId ? { intentId: supplied.intentId } : {}),
      ...(supplied?.effectId ? { effectId: supplied.effectId } : {})
    };
    this.nextSequenceByPlayer.set(
      command.playerNumber,
      Math.max(this.nextSequenceByPlayer.get(command.playerNumber) ?? 0, sequence + 1)
    );
    return { ...command, tick, execution } as GameCommand;
  }

  private allocateSequence(playerNumber: PlayerNumber): number {
    const sequence = this.nextSequenceByPlayer.get(playerNumber) ?? 0;
    this.nextSequenceByPlayer.set(playerNumber, sequence + 1);
    return sequence;
  }

  private inferSource(playerNumber: PlayerNumber): GameCommandExecution["source"] {
    const player = this.scene.players.find((candidate) => candidate.playerNumber === playerNumber);
    return player?.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI ? "ai" : "human";
  }

  private defaultCommitmentKey(command: GameCommandInput, commandId: string): string {
    switch (command.type) {
      case ProbableWaffleGameCommandTypes.Construct:
        return `construct:${command.siteKey}`;
      case ProbableWaffleGameCommandTypes.Production:
        return `produce:${command.playerNumber}:${command.actorIds[0] ?? "missing"}:${command.actorName}:${commandId}`;
      case ProbableWaffleGameCommandTypes.Research:
        return `research:${command.playerNumber}:${command.researchType}`;
      case ProbableWaffleGameCommandTypes.CastSpell:
        return `spell:${command.playerNumber}:${command.actorIds[0] ?? "missing"}:${command.spellType}:${commandId}`;
      default:
        return commandId;
    }
  }

  private emitForApplication(command: GameCommand, legacyIndex = 0): void {
    const upgraded = command.execution
      ? command
      : this.upgradeLegacyCommand(command, command.playerNumber, legacyIndex);
    const execution = upgraded.execution!;
    if (execution.authorityEpoch < this.authorityEpoch) {
      this.reportOutcome(upgraded, "rejected", "stale_authority_epoch");
      return;
    }
    if (execution.authorityEpoch > this.authorityEpoch) {
      this.advanceAuthorityEpoch(execution.authorityEpoch);
    }
    if (
      isProcessedCommandSequence(
        execution.sequence,
        this.processedSequenceWatermarkByPlayer.get(upgraded.playerNumber) ?? -1
      )
    ) {
      this.reportOutcome(upgraded, "rejected", "duplicate_command", upgraded.actorIds, [], "sequence_watermark");
      return;
    }
    if (this.processedCommandIds.has(execution.commandId)) {
      this.reportOutcome(upgraded, "rejected", "duplicate_command");
      return;
    }
    if (
      execution.source === "ai" &&
      [...this.expectedActorIdsByCommand.keys()].filter((commandId) =>
        commandId.startsWith(`${upgraded.playerNumber}:`)
      ).length >= CommandBusService.ACTIVE_AI_COMMAND_LIMIT
    ) {
      this.reportOutcome(upgraded, "rejected", "outcome_backlog_overflow", upgraded.actorIds, [], "authority_backpressure");
      return;
    }
    const activeCommandId = this.activeCommitments.get(execution.commitmentKey);
    if (activeCommandId && activeCommandId !== execution.commandId) {
      this.reportOutcome(upgraded, "rejected", "duplicate_command", upgraded.actorIds, [], `commitment:${activeCommandId}`);
      return;
    }
    this.processedCommandIds.set(execution.commandId, upgraded.tick);
    this.processedSequenceWatermarkByPlayer.set(
      upgraded.playerNumber,
      advanceProcessedCommandSequence(
        this.processedSequenceWatermarkByPlayer.get(upgraded.playerNumber) ?? -1,
        execution.sequence
      )
    );
    this.activeCommitments.set(execution.commitmentKey, execution.commandId);
    this.expectedActorIdsByCommand.set(execution.commandId, [...upgraded.actorIds].sort());
    while (this.processedCommandIds.size > CommandBusService.PROCESSED_COMMAND_LIMIT) {
      const oldest = this.processedCommandIds.keys().next().value as string | undefined;
      if (!oldest) break;
      this.processedCommandIds.delete(oldest);
    }
    const addressError = this.getApplicationAddressError(upgraded);
    if (addressError) {
      this.reportOutcome(upgraded, "rejected", addressError);
      return;
    }
    this._command$.next(upgraded);
  }

  private getApplicationAddressError(command: GameCommand): GameCommandOutcomeReason | null {
    if (command.type === ProbableWaffleGameCommandTypes.Concede) return null;
    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    if (!actorIndex) return "application_failed";
    for (const actorId of command.actorIds) {
      const actor = actorIndex.getActorById(actorId);
      if (!actor) return "missing_actor";
      if (!actor.active) return "inactive_actor";
      if (getActorComponent(actor, OwnerComponent)?.getOwner() !== command.playerNumber) return "invalid_owner";
    }
    if (command.type === ProbableWaffleGameCommandTypes.ActorAction) {
      if (command.targetObjectIds?.some((targetId) => !actorIndex.getActorById(targetId))) return "invalid_target";
    }
    if (
      command.type === ProbableWaffleGameCommandTypes.CastSpell &&
      command.targetObjectId &&
      !actorIndex.getActorById(command.targetObjectId)
    ) {
      return "invalid_target";
    }
    if (
      command.type === ProbableWaffleGameCommandTypes.SetRallyPoint &&
      command.targetObjectId &&
      !actorIndex.getActorById(command.targetObjectId)
    ) {
      return "invalid_target";
    }
    return null;
  }

  private upgradeLegacyCommand(command: GameCommand, batchPlayerNumber: PlayerNumber, index: number): GameCommand {
    if (command.execution) return command;
    const sequence = command.tick * 1000 + index;
    return {
      ...command,
      execution: {
        schemaVersion: 1,
        commandId: `${command.playerNumber}:0:${sequence}:legacy-${batchPlayerNumber}`,
        commitmentKey: `${command.playerNumber}:legacy:${command.tick}:${index}`,
        source: "replay",
        authorityEpoch: 0,
        sequence
      }
    };
  }

  private restoreAuthorityState(state: GameCommandAuthorityState): void {
    if (state.schemaVersion !== 1) throw new Error(`Unsupported command authority schema: ${state.schemaVersion}`);
    if (state.authorityEpoch < this.authorityEpoch) return;
    this.authorityEpoch = state.authorityEpoch;
    this.nextSequenceByPlayer.clear();
    for (const [playerNumber, sequence] of Object.entries(state.nextSequenceByPlayer)) {
      this.nextSequenceByPlayer.set(Number(playerNumber), sequence);
    }
    this.processedSequenceWatermarkByPlayer.clear();
    for (const [playerNumber, sequence] of Object.entries(state.processedSequenceWatermarkByPlayer ?? {})) {
      this.processedSequenceWatermarkByPlayer.set(Number(playerNumber), sequence);
      this.nextSequenceByPlayer.set(
        Number(playerNumber),
        Math.max(this.nextSequenceByPlayer.get(Number(playerNumber)) ?? 0, sequence + 1)
      );
    }
    this.processedCommandIds.clear();
    for (const commandId of state.processedCommandIds.slice(-CommandBusService.PROCESSED_COMMAND_LIMIT)) {
      this.processedCommandIds.set(commandId, -1);
    }
    this.activeCommitments.clear();
    for (const [commitmentKey, commandId] of Object.entries(state.activeCommitments ?? {})) {
      this.activeCommitments.set(commitmentKey, commandId);
    }
    this.recentOutcomes.splice(
      0,
      this.recentOutcomes.length,
      ...structuredClone(state.outcomes.slice(-CommandBusService.OUTCOME_HISTORY_LIMIT))
    );
    this.expectedActorIdsByCommand.clear();
    this.terminalActorIdsByCommand.clear();
    for (const [commandId, progress] of Object.entries(state.activeCommandProgress ?? {})) {
      this.expectedActorIdsByCommand.set(commandId, [...progress.expectedActorIds].sort());
      this.terminalActorIdsByCommand.set(commandId, new Set(progress.terminalActorIds));
    }
    const activeCommandIds = new Set(this.activeCommitments.values());
    for (const outcome of this.recentOutcomes) {
      if (
        activeCommandIds.has(outcome.commandId) &&
        outcome.kind === "dispatched" &&
        !this.expectedActorIdsByCommand.has(outcome.commandId)
      ) {
        this.expectedActorIdsByCommand.set(outcome.commandId, [...outcome.actorIds].sort());
      }
      if (!activeCommandIds.has(outcome.commandId)) continue;
      if (
        outcome.kind !== "completed" &&
        outcome.kind !== "rejected" &&
        outcome.kind !== "cancelled" &&
        outcome.kind !== "failed"
      ) {
        continue;
      }
      const terminalActorIds = this.terminalActorIdsByCommand.get(outcome.commandId) ?? new Set<string>();
      outcome.actorIds.forEach((actorId) => terminalActorIds.add(actorId));
      this.terminalActorIdsByCommand.set(outcome.commandId, terminalActorIds);
    }
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
    this.sentCommandsByTick.clear();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this._commandBatch$.complete();
    this._commandOutcome$.complete();
    this._command$.complete();
  }

  private debugLog(message: string): void {
    if (!this.debug) {
      return;
    }
    this.logger.info(`[CommandBus] ${this.getMultiplayerLogContext()} ${message}`);
  }

  private recordLocalTickStage(tick: number, stage: string): void {
    if (!Number.isInteger(tick) || tick < 0) {
      return;
    }
    const stages = this.localTickTimeline.get(tick) ?? [];
    stages.push(stage);
    // Keep the per-tick sequence readable in logs without letting noisy repeats grow forever.
    if (stages.length > 6) {
      stages.shift();
    }
    this.localTickTimeline.set(tick, stages);

    // Keep only a short tail around the latest local send cursor.
    const floorTick = Math.max(0, this.lastSentExecutionTick - 8);
    for (const knownTick of [...this.localTickTimeline.keys()]) {
      if (knownTick < floorTick) {
        this.localTickTimeline.delete(knownTick);
      }
    }
    for (const knownTick of [...this.sentTransportSequenceByTick.keys()]) {
      if (knownTick < floorTick) {
        this.sentTransportSequenceByTick.delete(knownTick);
      }
    }
  }

  private describeRecentLocalTickTimeline(): string {
    return [...this.localTickTimeline.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([tick, stages]) => `${tick}:${stages.join(">")}`)
      .join(" | ");
  }

  private recordRemoteReceiveStage(playerNumber: PlayerNumber, stage: string): void {
    const stages = this.remoteReceiveTimeline.get(playerNumber) ?? [];
    stages.push(stage);
    if (stages.length > 8) {
      stages.shift();
    }
    this.remoteReceiveTimeline.set(playerNumber, stages);
  }

  private describeRemoteReceiveTimeline(): string {
    return [...this.remoteReceiveTimeline.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([playerNumber, stages]) => `${playerNumber}:${stages.join(">")}`)
      .join(" | ");
  }

  private observeReceivedCommandEvent(event: ProbableWaffleGameCommandEvent): void {
    const previousReceivedTick = this.lastReceivedTickByPlayer.get(event.playerNumber) ?? 0;
    const previousRelaySequence = this.lastReceivedRelaySequenceByPlayer.get(event.playerNumber) ?? 0;
    const relaySequence = event.transportMeta?.serverRelaySequence;
    const tickOrder =
      event.tick <= previousReceivedTick
        ? "duplicate-or-late"
        : event.tick === previousReceivedTick + 1
          ? "in-order"
          : `gap+${event.tick - previousReceivedTick - 1}`;
    const relayOrder =
      relaySequence === undefined
        ? "no-relay-seq"
        : relaySequence <= previousRelaySequence
          ? "duplicate-or-late"
          : relaySequence === previousRelaySequence + 1
            ? "in-order"
            : `jump+${relaySequence - previousRelaySequence - 1}`;
    const wallLatency =
      event.transportMeta?.serverReceivedAtWallTimeMs !== undefined
        ? Math.max(0, Date.now() - event.transportMeta.serverReceivedAtWallTimeMs)
        : undefined;
    this.recordRemoteReceiveStage(
      event.playerNumber,
      `tick=${event.tick}/${tickOrder},relaySeq=${relaySequence ?? "none"}/${relayOrder},commands=${event.commands.length}`
    );
    if (relaySequence !== undefined) {
      this.lastReceivedRelaySequenceByPlayer.set(event.playerNumber, Math.max(previousRelaySequence, relaySequence));
    }

    if (tickOrder !== "in-order" || relayOrder !== "in-order") {
      this.logger.warn(
        `[CommandBus][RECEIVE-ORDER] ${this.getMultiplayerLogContext()} player=${event.playerNumber} tick=${event.tick} tickOrder=${tickOrder} previousReceivedTick=${previousReceivedTick} relaySequence=${relaySequence ?? "none"} relayOrder=${relayOrder} clientSequence=${event.transportMeta?.clientSequence ?? "none"} clientObservedTick=${event.transportMeta?.clientObservedTick ?? "none"} clientAckTick=${event.transportMeta?.clientAcknowledgedLocalTick ?? "none"} source=${event.transportMeta?.clientSource ?? "unknown"} wallRelayLatencyMs=${wallLatency ?? "none"} recentRemoteTicks={${this.describeRemoteReceiveTimeline()}}`
      );
    }
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
    this.lastLoggedStallTick = nextTick;
    this.debugLog(
      `stall nextTick=${nextTick} committed=${committed.join(",") || "none"} missing=${missing.join(",") || "none"} pauses=${pauseReasons}`
    );
    const lastReceivedByPlayer = this.humanPlayerNumbers
      .map((playerNumber) => `${playerNumber}:${this.lastReceivedTickByPlayer.get(playerNumber) ?? "none"}`)
      .join(" ");
    const socketConnected = this.scene?.baseGameData.communicator.activeSocket
      ? (getNgxSocketIoRawSocket(this.scene.baseGameData.communicator.activeSocket)?.connected ?? "unknown")
      : "no-socket";
    const missingReasons = this.describeMissingPlayers(nextTick, missing);
    const localTimeline = this.describeRecentLocalTickTimeline();
    this.logger.warn(
      `[CommandBus][STALL] ${this.getMultiplayerLogContext()} nextTick=${nextTick} waitingForPlayers=${missing.join(",") || "none"} committedBy=${committed.join(",") || "none"} pauses=${pauseReasons} localPlayer=${this.localPlayerNumber ?? "none"} lastSentLocalTick=${this.lastSentTickByLocalPlayer ?? "none"} lastReceivedByPlayer={${lastReceivedByPlayer}} missingReasons={${missingReasons}} recentLocalTicks={${localTimeline}} recentRemoteTicks={${this.describeRemoteReceiveTimeline()}} socketConnected=${socketConnected}`
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
    const missing = this.humanPlayerNumbers.filter(
      (playerNumber) => !this.buffer.getCommittedPlayers(nextTick).includes(playerNumber)
    );
    // A single missing next-tick heartbeat is the common jitter case now. Give
    // that path a slightly longer window before escalating it to a hard stall log.
    const delayMs = this.isOnlyOneTickLag(nextTick, missing) ? 400 : CommandBusService.STALL_LOG_DELAY_MS;
    this.stallLogTimer = window.setTimeout(() => {
      this.stallLogTimer = null;
      this.pendingStallTick = null;
      if (!this.tickService || this.hasAllForTick(nextTick)) {
        return;
      }
      this.logStall(nextTick);
    }, delayMs);
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
    if (!this.tickService || !this.tickService.getPauseReasons().includes(SimulationPauseReason.Lockstep)) {
      return;
    }

    const blockedTick = this.tickService.currentTick + 1;
    const committed = this.buffer.getCommittedPlayers(blockedTick);
    const missing = this.humanPlayerNumbers.filter((humanPlayerNumber) => !committed.includes(humanPlayerNumber));
    if (missing.length === 0) {
      return;
    }
    // Avoid spamming "queued while stalled" for the expected one-tick-lag case
    // until the stall itself has persisted long enough to earn a real warning.
    if (this.isOnlyOneTickLag(blockedTick, missing) && this.lastLoggedStallTick !== blockedTick) {
      return;
    }

    const signature = `${commandType}|${executeTick}|${blockedTick}|${missing.join(",")}|${committed.join(",")}`;
    if (signature === this.queuedWhileStalledSignature) {
      return;
    }
    this.queuedWhileStalledSignature = signature;
    const missingReasons = this.describeMissingPlayers(blockedTick, missing);
    this.logger.warn(
      `[CommandBus][QUEUE-WHILE-STALLED] ${this.getMultiplayerLogContext()} command=${commandType} player=${playerNumber} executeTick=${executeTick} blockedTick=${blockedTick} missingPlayers=${missing.join(",")} committedPlayers=${committed.join(",") || "none"} missingReasons={${missingReasons}} recentLocalTicks={${this.describeRecentLocalTickTimeline()}} recentRemoteTicks={${this.describeRemoteReceiveTimeline()}}`
    );
  }

  private getMultiplayerLogContext(): string {
    const scene = this.scene;
    if (!scene) {
      return "role=unknown isHost=unknown localPlayer=none";
    }

    const role = scene.isHost ? "authoritative-host" : "non-host";
    const metadataData = scene.baseGameData.gameInstance.gameInstanceMetadata.data;
    const hostUserId = metadataData.currentHostUserId ?? metadataData.createdBy ?? "unknown";
    return `role=${role} isHost=${scene.isHost} localPlayer=${this.localPlayerNumber ?? "none"} hostUser=${hostUserId}`;
  }

  /** Documents the describe missing players member and its declared contract at this boundary. */
  private describeMissingPlayers(blockedTick: number, missingPlayers: readonly PlayerNumber[]): string {
    if (missingPlayers.length === 0) {
      return "none";
    }

    return missingPlayers
      .map((missingPlayer) => {
        const lastReceived = this.lastReceivedTickByPlayer.get(missingPlayer);
        if (lastReceived === undefined) {
          return `${missingPlayer}:no-batch-received-yet(likely:not-joined-or-no-socket-traffic)`;
        }
        if (lastReceived < blockedTick) {
          const ticksBehind = blockedTick - lastReceived;
          const lagLabel =
            ticksBehind === 1 ? "awaiting-next-commit(one-tick-lag)" : "remote-not-advancing(multi-tick-lag)";
          return `${missingPlayer}:last-received=${lastReceived},missing=${blockedTick},behind=${ticksBehind},cause=${lagLabel}`;
        }
        if (missingPlayer === this.localPlayerNumber) {
          return `${missingPlayer}:last-received=${lastReceived},local-slot-missing-for-${blockedTick}(check-local-send-or-server-echo)`;
        }
        return `${missingPlayer}:last-received=${lastReceived},not-committed-in-buffer-for-${blockedTick}`;
      })
      .join(" ");
  }

  private isOnlyOneTickLag(blockedTick: number, missingPlayers: readonly PlayerNumber[]): boolean {
    return (
      missingPlayers.length > 0 &&
      missingPlayers.every((missingPlayer) => this.lastReceivedTickByPlayer.get(missingPlayer) === blockedTick - 1)
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

    if (command.type === ProbableWaffleGameCommandTypes.Concede) {
      const playerExists = this.scene.players.some((player) => player.playerNumber === command.playerNumber);
      return playerExists ? { ...command, actorIds: [] } : null;
    }

    const actorIds = [...new Set(command.actorIds)];

    if (actorIds.length === 0) {
      this.debugLog(`dropping command type=${command.type} because no valid owned actors remained after sanitization`);
      return null;
    }

    if (command.type === ProbableWaffleGameCommandTypes.ActorAction) {
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

  private getInputAddressError(command: GameCommandInput): GameCommandOutcomeReason | null {
    const player = this.scene.players.find((candidate) => candidate.playerNumber === command.playerNumber);
    if (!player) return "invalid_owner";
    const isAi = player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI;
    if (this.isMultiplayer && isAi && !this.scene.isHost) return "invalid_owner";
    if (
      this.isMultiplayer &&
      !isAi &&
      this.localPlayerNumber !== null &&
      command.playerNumber !== this.localPlayerNumber
    ) {
      return "invalid_owner";
    }
    if (command.type === ProbableWaffleGameCommandTypes.Concede) return null;
    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    if (!actorIndex) return "application_failed";
    for (const actorId of command.actorIds) {
      const actor = actorIndex.getActorById(actorId);
      if (!actor) return "missing_actor";
      if (!actor.active) return "inactive_actor";
      if (actor.getData("campaign.controllable") === false) return "invalid_owner";
      if (getActorComponent(actor, OwnerComponent)?.getOwner() !== command.playerNumber) return "invalid_owner";
    }
    if (command.type === ProbableWaffleGameCommandTypes.ActorAction) {
      if (command.targetObjectIds?.some((targetId) => !actorIndex.getActorById(targetId))) return "invalid_target";
    }
    if (
      command.type === ProbableWaffleGameCommandTypes.CastSpell &&
      command.targetObjectId &&
      !actorIndex.getActorById(command.targetObjectId)
    ) {
      return "invalid_target";
    }
    if (
      command.type === ProbableWaffleGameCommandTypes.SetRallyPoint &&
      command.targetObjectId &&
      !actorIndex.getActorById(command.targetObjectId)
    ) {
      return "invalid_target";
    }
    return null;
  }

  private get tickService(): SimulationTickService {
    return getSceneService(this.scene, SimulationTickService)!;
  }
}
