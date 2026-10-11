import Phaser from "phaser";
import { Subject } from "rxjs";
import {
  type GameCommand,
  type GameCommandAuthorityState,
  type GameCommandInput,
  type GameCommandOutcome,
  type GameCommandOutcomeKind,
  type GameCommandOutcomeReason,
  type ProbableWaffleReplayCommandBatch
} from "@fuzzy-waddle/probable-waffle-protocol";
import { type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { SimulationTickService } from "../simulation-tick.service";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";

import { getSceneService } from "../scene-component-helpers";

import { CommandAuthority } from "./command-authority";
import { CommandLockstep } from "./command-lockstep";
import { getInputAddressError, normalizeCommand } from "./command-address-validation";
import type { GameCommandDispatchReceipt } from "./game-command-dispatch-receipt";
import type { AiGameCommandCorrelation } from "./ai-game-command-correlation";
export type { GameCommandDispatchReceipt } from "./game-command-dispatch-receipt";
export type { AiGameCommandCorrelation } from "./ai-game-command-correlation";
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
  static get INPUT_DELAY_TICKS(): number {
    return CommandLockstep.INPUT_DELAY_TICKS;
  }
  private readonly authority: CommandAuthority;
  private readonly transport: CommandLockstep;
  constructor(private readonly scene: ProbableWaffleScene) {
    this.transport = new CommandLockstep(
      scene,
      (command, index) => this.authority.emitForApplication(command, index),
      (...args) => this.authority.reportOutcome(...args),
      (batch) => this.emitRecordedBatch(batch),
      (state) => this.authority.restoreAuthorityState(state)
    );
    this.authority = new CommandAuthority(
      scene,
      (command) => this._command$.next(command),
      (outcome) => this._commandOutcome$.next(outcome),
      () => this.transport.pendingOutbound.clear()
    );
    // Scene shutdown owns teardown in single-player and partially initialized multiplayer sessions.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    const persisted = scene.baseGameData.gameInstance.gameState?.data.commandAuthority;
    if (persisted) this.authority.restoreAuthorityState(persisted);
  }

  private readonly _command$ = new Subject<GameCommand>();

  readonly command$ = this._command$.asObservable();

  private readonly _commandBatch$ = new Subject<ProbableWaffleReplayCommandBatch>();

  readonly commandBatch$ = this._commandBatch$.asObservable();

  private readonly _commandOutcome$ = new Subject<GameCommandOutcome>();

  readonly commandOutcome$ = this._commandOutcome$.asObservable();

  dispatch(command: GameCommandInput): GameCommandDispatchReceipt {
    if (this.scene?.isSpectator || this.scene?.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return { status: "rejected", reason: "application_failed" };
    }

    const inputError = getInputAddressError(this.scene, this.transport, command);
    if (inputError) {
      const rejected = this.authority.stampCommand(
        { ...command, actorIds: [...new Set(command.actorIds)] },
        this.tickService?.currentTick ?? 0
      );
      this.authority.reportOutcome(rejected, "rejected", inputError);
      return { status: "rejected", reason: inputError };
    }

    const normalizedCommand = normalizeCommand(this.scene, this.transport, command);
    if (!normalizedCommand) {
      return { status: "rejected", reason: "invalid_owner" };
    }

    if (!this.transport.isMultiplayer) {
      // Single-player: stamp and emit immediately
      const tick = this.tickService?.currentTick ?? 0;
      const stamped = this.authority.stampCommand(normalizedCommand, tick);
      this.emitRecordedBatch({
        tick,
        playerNumber: stamped.playerNumber,
        commands: [stamped]
      });
      this.authority.reportOutcome(stamped, "dispatched", "accepted_for_dispatch");
      this.authority.emitForApplication(stamped);
      return { status: "dispatched", command: stamped };
    }

    // Multiplayer: stamp with delay, but never target a batch tick that has already been sent.
    const requestedTick = (this.tickService?.currentTick ?? 0) + CommandBusService.INPUT_DELAY_TICKS;
    // Server echo is the source of truth for what it already accepted from us.
    // Never enqueue a command into a tick that is <= last acknowledged local tick.
    const acknowledgedLocalTick =
      this.transport.localPlayerNumber !== null
        ? (this.transport.lastReceivedTickByPlayer.get(this.transport.localPlayerNumber) ?? -1)
        : -1;
    const tick = Math.max(requestedTick, this.transport.lastSentExecutionTick + 1, acknowledgedLocalTick + 1);
    const stamped = this.authority.stampCommand(normalizedCommand, tick);
    if (!this.transport.pendingOutbound.has(tick)) {
      this.transport.pendingOutbound.set(tick, []);
    }
    this.transport.pendingOutbound.get(tick)!.push(stamped);
    this.transport.diagnostics.debugLog(
      "queued command type=" +
        normalizedCommand.type +
        " executeTick=" +
        tick +
        " requestedTick=" +
        requestedTick +
        " player=" +
        stamped.playerNumber +
        " actors=" +
        stamped.actorIds.length
    );
    this.transport.diagnostics.logQueuedWhileStalled(normalizedCommand.type, tick, stamped.playerNumber);
    this.authority.reportOutcome(stamped, "dispatched", "accepted_for_dispatch");
    return { status: "dispatched", command: stamped };
  }

  /** Admits an AI intent through the normal bus while preserving exact command/outcome correlation. */
  dispatchAi(command: GameCommandInput, correlation: AiGameCommandCorrelation): GameCommandDispatchReceipt {
    const sequence = this.authority.allocateSequence(command.playerNumber);
    const authorityEpoch = this.authority.authorityEpoch;
    const commandId = `${command.playerNumber}:${authorityEpoch}:${sequence}:${this.scene.gameInstanceId}`;
    return this.dispatch({
      ...command,
      execution: {
        schemaVersion: 1,
        commandId,
        commitmentKey: correlation.commitmentKey,
        source: "ai",
        authorityEpoch,
        sequence,
        intentId: correlation.intentId,
        effectId: correlation.effectId
      }
    } as GameCommandInput);
  }

  /** Documents the dispatch deterministic member and its declared contract at this boundary. */
  dispatchDeterministic(command: GameCommandInput): GameCommandDispatchReceipt {
    const tick = this.tickService?.currentTick ?? 0;
    const inputError = getInputAddressError(this.scene, this.transport, command);
    if (inputError) {
      const rejected = this.authority.stampCommand({ ...command, actorIds: [...new Set(command.actorIds)] }, tick);
      this.authority.reportOutcome(rejected, "rejected", inputError);
      return { status: "rejected", reason: inputError };
    }
    const normalized = normalizeCommand(this.scene, this.transport, command);
    if (!normalized) return { status: "rejected", reason: "invalid_owner" };
    const stamped = this.authority.stampCommand(normalized, tick);
    this.authority.reportOutcome(stamped, "dispatched", "accepted_for_dispatch");
    this.authority.emitForApplication(stamped);
    return { status: "dispatched", command: stamped };
  }

  playReplayBatch(batch: ProbableWaffleReplayCommandBatch): void {
    for (const [index, command] of batch.commands.entries()) {
      this.authority.emitForApplication(this.authority.upgradeLegacyCommand(command, batch.playerNumber, index));
    }
  }

  emitRecordedBatch(batch: ProbableWaffleReplayCommandBatch): void {
    this._commandBatch$.next({
      tick: batch.tick,
      playerNumber: batch.playerNumber,
      commands: structuredClone(batch.commands)
    });
  }

  get tickService(): SimulationTickService {
    return getSceneService(this.scene, SimulationTickService)!;
  }
  tryInitMultiplayer(): void {
    this.transport.tryInitMultiplayer();
  }
  reportOutcome(
    command: GameCommand,
    kind: GameCommandOutcomeKind,
    reason: GameCommandOutcomeReason,
    actorIds: readonly string[] = command.actorIds,
    worldLinkIds: readonly string[] = [],
    detail?: string
  ): void {
    this.authority.reportOutcome(command, kind, reason, actorIds, worldLinkIds, detail);
  }
  reportPersistedOutcome(outcome: GameCommandOutcome): void {
    this.authority.reportPersistedOutcome(outcome);
  }
  getAuthorityState(): GameCommandAuthorityState {
    return this.authority.getAuthorityState();
  }
  advanceAuthorityEpoch(nextEpoch: number): void {
    this.authority.advanceAuthorityEpoch(nextEpoch);
  }
  resetAfterSnapshot(
    snapshotTick: number,
    commandTail: readonly ProbableWaffleReplayCommandBatch[] = [],
    authorityState?: GameCommandAuthorityState
  ): void {
    this.transport.resetAfterSnapshot(snapshotTick, commandTail, authorityState);
  }
  removePlayerFromLockstep(playerNumber: PlayerNumber): void {
    this.transport.removePlayerFromLockstep(playerNumber);
  }
  destroy(): void {
    this.transport.destroy();
    this._commandBatch$.complete();
    this._commandOutcome$.complete();
    this._command$.complete();
  }
}
