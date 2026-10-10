import { isSettlingCommandOutcome } from "./is-settling-command-outcome";
import { CommandCommitmentRegistry } from "./command-commitment-registry";
import {
  type GameCommand,
  type GameCommandAuthorityState,
  type GameCommandExecution,
  type GameCommandInput,
  type GameCommandOutcome,
  type GameCommandOutcomeKind,
  type GameCommandOutcomeReason,
  ProbableWaffleGameCommandTypes,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { type PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { SimulationTickService } from "../simulation-tick.service";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";

import { getSceneService } from "../scene-component-helpers";

import { advanceProcessedCommandSequence, isProcessedCommandSequence } from "./command-authority-policy";

import { getApplicationAddressError } from "./command-address-validation";
/** Owns command identity, application admission, terminal progress and the save frontier. */
export class CommandAuthority {
  /** Application/outcome callbacks remain synchronous; advancing the host fence also drops unsent relay work. */
  constructor(
    readonly scene: ProbableWaffleScene,
    readonly onCommand: (command: GameCommand) => void,
    readonly onOutcome: (outcome: GameCommandOutcome) => void,
    readonly onEpochAdvance: () => void
  ) {}

  static readonly PROCESSED_COMMAND_LIMIT = 2048;

  static readonly OUTCOME_HISTORY_LIMIT = 512;

  static readonly ACTIVE_AI_COMMAND_LIMIT = 128;

  authorityEpoch = 0;

  readonly nextSequenceByPlayer = new Map<PlayerNumber, number>();

  readonly processedSequenceWatermarkByPlayer = new Map<PlayerNumber, number>();

  readonly processedCommandIds = new Map<string, number>();

  private readonly activeCommitments = new CommandCommitmentRegistry();

  readonly expectedActorIdsByCommand = new Map<string, readonly string[]>();

  readonly terminalActorIdsByCommand = new Map<string, Set<string>>();

  readonly recentOutcomes: GameCommandOutcome[] = [];

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
    const observedTick = kind === "dispatched" ? command.tick : (this.tickService?.currentTick ?? command.tick);
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
    if (isSettlingCommandOutcome(outcome)) {
      if (this.activeCommitments.get(outcome.playerNumber, outcome.commitmentKey) === outcome.commandId) {
        const terminalActorIds = this.terminalActorIdsByCommand.get(outcome.commandId) ?? new Set<string>();
        outcome.actorIds.forEach((actorId) => terminalActorIds.add(actorId));
        this.terminalActorIdsByCommand.set(outcome.commandId, terminalActorIds);
        const expectedActorIds = this.expectedActorIdsByCommand.get(outcome.commandId) ?? outcome.actorIds;
        const settled =
          expectedActorIds.length === 0 || expectedActorIds.every((actorId) => terminalActorIds.has(actorId));
        if (settled && this.activeCommitments.get(outcome.playerNumber, outcome.commitmentKey) === outcome.commandId) {
          this.activeCommitments.delete(outcome.playerNumber, outcome.commitmentKey);
          this.expectedActorIdsByCommand.delete(outcome.commandId);
          this.terminalActorIdsByCommand.delete(outcome.commandId);
        }
      }
    }
    this.recentOutcomes.push(outcome);
    if (this.recentOutcomes.length > CommandAuthority.OUTCOME_HISTORY_LIMIT) {
      this.recentOutcomes.splice(0, this.recentOutcomes.length - CommandAuthority.OUTCOME_HISTORY_LIMIT);
    }
    this.onOutcome(outcome);
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
      activeCommitmentsByPlayer: this.activeCommitments.snapshot(),
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
    this.onEpochAdvance();
  }

  stampCommand(command: GameCommandInput, tick: number): GameCommand {
    const supplied = command.execution;
    const sequence = supplied?.sequence ?? this.allocateSequence(command.playerNumber);
    const authorityEpoch = supplied?.authorityEpoch ?? this.authorityEpoch;
    const commandId =
      supplied?.commandId ?? `${command.playerNumber}:${authorityEpoch}:${sequence}:${this.scene.gameInstanceId}`;
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

  allocateSequence(playerNumber: PlayerNumber): number {
    const sequence = this.nextSequenceByPlayer.get(playerNumber) ?? 0;
    this.nextSequenceByPlayer.set(playerNumber, sequence + 1);
    return sequence;
  }

  inferSource(playerNumber: PlayerNumber): GameCommandExecution["source"] {
    const player = this.scene.players.find((candidate) => candidate.playerNumber === playerNumber);
    return player?.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI ? "ai" : "human";
  }

  defaultCommitmentKey(command: GameCommandInput, commandId: string): string {
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

  emitForApplication(command: GameCommand, legacyIndex = 0): void {
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
      ).length >= CommandAuthority.ACTIVE_AI_COMMAND_LIMIT
    ) {
      this.reportOutcome(
        upgraded,
        "rejected",
        "outcome_backlog_overflow",
        upgraded.actorIds,
        [],
        "authority_backpressure"
      );
      return;
    }
    const activeCommandId = this.activeCommitments.get(upgraded.playerNumber, execution.commitmentKey);
    if (activeCommandId && activeCommandId !== execution.commandId) {
      this.reportOutcome(
        upgraded,
        "rejected",
        "duplicate_command",
        upgraded.actorIds,
        [],
        `commitment:${activeCommandId}`
      );
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
    this.activeCommitments.set(upgraded.playerNumber, execution.commitmentKey, execution.commandId);
    this.expectedActorIdsByCommand.set(execution.commandId, [...upgraded.actorIds].sort());
    while (this.processedCommandIds.size > CommandAuthority.PROCESSED_COMMAND_LIMIT) {
      const oldest = this.processedCommandIds.keys().next().value as string | undefined;
      if (!oldest) break;
      this.processedCommandIds.delete(oldest);
    }
    const addressError = getApplicationAddressError(this.scene, upgraded);
    if (addressError) {
      this.reportOutcome(upgraded, "rejected", addressError);
      return;
    }
    this.onCommand(upgraded);
  }

  upgradeLegacyCommand(command: GameCommand, batchPlayerNumber: PlayerNumber, index: number): GameCommand {
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

  restoreAuthorityState(state: GameCommandAuthorityState): void {
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
    for (const commandId of state.processedCommandIds.slice(-CommandAuthority.PROCESSED_COMMAND_LIMIT)) {
      this.processedCommandIds.set(commandId, -1);
    }
    this.activeCommitments.restore(state);
    this.recentOutcomes.splice(
      0,
      this.recentOutcomes.length,
      ...structuredClone(state.outcomes.slice(-CommandAuthority.OUTCOME_HISTORY_LIMIT))
    );
    this.expectedActorIdsByCommand.clear();
    this.terminalActorIdsByCommand.clear();
    for (const [commandId, progress] of Object.entries(state.activeCommandProgress ?? {})) {
      this.expectedActorIdsByCommand.set(commandId, [...progress.expectedActorIds].sort());
      this.terminalActorIdsByCommand.set(commandId, new Set(progress.terminalActorIds));
    }
    const activeCommandIds = new Set(this.activeCommitments.commandIds());
    for (const outcome of this.recentOutcomes) {
      if (
        activeCommandIds.has(outcome.commandId) &&
        outcome.kind === "dispatched" &&
        !this.expectedActorIdsByCommand.has(outcome.commandId)
      ) {
        this.expectedActorIdsByCommand.set(outcome.commandId, [...outcome.actorIds].sort());
      }
      if (this.activeCommitments.get(outcome.playerNumber, outcome.commitmentKey) !== outcome.commandId) continue;
      if (!isSettlingCommandOutcome(outcome)) {
        continue;
      }
      const terminalActorIds = this.terminalActorIdsByCommand.get(outcome.commandId) ?? new Set<string>();
      outcome.actorIds.forEach((actorId) => terminalActorIds.add(actorId));
      this.terminalActorIdsByCommand.set(outcome.commandId, terminalActorIds);
    }
  }

  get tickService(): SimulationTickService {
    return getSceneService(this.scene, SimulationTickService)!;
  }
}
