import type {
  AiCommandReconciliationStateData,
  GameCommandOutcome
} from "@fuzzy-waddle/probable-waffle-protocol";
import { aiDeadline, type AiAuthorityStateV1, type AiCommandOutcomeV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";
import type { Subscription } from "rxjs";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { adaptCommandAuthorityToBrain, adaptGameCommandOutcomesToBrain } from "./ai-command-outcome-adapter";

type PendingOutcome = {
  dispatched: GameCommandOutcome;
  lastProgressTick: number;
  applicationObserved: boolean;
  terminalActorIds: Set<string>;
};

/**
 * Turns command lifecycle events into bounded AI-owned certainty. A command is
 * pending until a terminal outcome arrives; missing terminal events become a
 * technical fault instead of silently authorizing a duplicate strategic action.
 */
export class AiCommandReconciliation {
  private static readonly MAX_PENDING = 128;
  private static readonly MAX_RECENT_OUTCOMES = 96;
  private static readonly LOST_OUTCOME_TICKS = 900;
  private static readonly LOST_ACTIVE_OUTCOME_TICKS = 7200;
  private readonly pending = new Map<string, PendingOutcome>();
  private recentOutcomes: GameCommandOutcome[] = [];
  private authorityEpoch = 0;
  private processedSequenceWatermark = -1;
  private health: AiCommandReconciliationStateData["health"] = "healthy";
  private outcomeSubscription?: Subscription;

  constructor(
    private readonly playerNumber: number,
    private readonly commandBus: CommandBusService
  ) {
    this.authorityEpoch = commandBus.getAuthorityState().authorityEpoch;
    this.outcomeSubscription = commandBus.commandOutcome$.subscribe((outcome) => this.observeOutcome(outcome));
  }

  observeTick(tick: number): void {
    const currentAuthorityEpoch = this.commandBus.getAuthorityState().authorityEpoch;
    if (currentAuthorityEpoch > this.authorityEpoch) {
      this.authorityEpoch = currentAuthorityEpoch;
      this.pending.clear();
      this.processedSequenceWatermark = -1;
      this.health = "reconciling";
    }
    const expired = [...this.pending.values()]
      .filter((entry) => {
        const timeout = entry.applicationObserved
          ? AiCommandReconciliation.LOST_ACTIVE_OUTCOME_TICKS
          : AiCommandReconciliation.LOST_OUTCOME_TICKS;
        return tick - entry.lastProgressTick >= timeout;
      })
      .sort(
        (left, right) =>
          left.dispatched.sequence - right.dispatched.sequence ||
          left.dispatched.commandId.localeCompare(right.dispatched.commandId)
      );
    for (const entry of expired) {
      this.health = "technical_fault";
      this.commandBus.reportPersistedOutcome({
        ...entry.dispatched,
        kind: "failed",
        reason: "lost_outcome",
        tick,
        detail: "terminal_outcome_timeout"
      });
    }
    if (this.pending.size > 0 && this.health === "healthy") this.health = "reconciling";
    if (this.pending.size === 0 && this.health === "reconciling") this.health = "healthy";
  }

  getState(): AiCommandReconciliationStateData {
    return {
      schemaVersion: 1,
      authorityEpoch: this.authorityEpoch,
      processedSequenceWatermark: this.processedSequenceWatermark,
      pendingCommandIds: [...this.pending.keys()].sort(),
      pendingCommands: [...this.pending.values()]
        .map((entry) => ({
          dispatched: structuredClone(entry.dispatched),
          lastProgressTick: entry.lastProgressTick,
          applicationObserved: entry.applicationObserved,
          terminalActorIds: [...entry.terminalActorIds].sort()
        }))
        .sort(
          (left, right) =>
            left.dispatched.sequence - right.dispatched.sequence ||
            left.dispatched.commandId.localeCompare(right.dispatched.commandId)
        ),
      recentOutcomes: structuredClone(this.recentOutcomes),
      health: this.health
    };
  }

  /** Supplies the Stage 2 pure brain with canonical, runtime-free command outcomes. */
  getBrainOutcomes(matchId: GameInstanceId): AiCommandOutcomeV1[] {
    return adaptGameCommandOutcomesToBrain(
      this.recentOutcomes.filter((outcome) => outcome.authorityEpoch === this.authorityEpoch),
      matchId
    );
  }

  /** Supplies the pure brain with the same authority fence used by live application. */
  getBrainAuthorityState(): AiAuthorityStateV1 {
    const oldestPending = [...this.pending.values()].sort(
      (left, right) => left.lastProgressTick - right.lastProgressTick || left.dispatched.sequence - right.dispatched.sequence
    )[0];
    const reconciliationDeadline = oldestPending
      ? aiDeadline(
          oldestPending.lastProgressTick +
            (oldestPending.applicationObserved
              ? AiCommandReconciliation.LOST_ACTIVE_OUTCOME_TICKS
              : AiCommandReconciliation.LOST_OUTCOME_TICKS)
        )
      : null;
    return adaptCommandAuthorityToBrain({
      authorityEpoch: this.authorityEpoch,
      processedSequenceWatermark: this.processedSequenceWatermark,
      pendingCommandIds: [...this.pending.keys()],
      pendingLimit: AiCommandReconciliation.MAX_PENDING,
      reconciliationDeadline,
      health: this.health
    });
  }

  setState(state: AiCommandReconciliationStateData, currentTick: number): void {
    const currentAuthorityEpoch = this.commandBus.getAuthorityState().authorityEpoch;
    if (state.authorityEpoch < currentAuthorityEpoch) {
      this.authorityEpoch = currentAuthorityEpoch;
      this.processedSequenceWatermark = -1;
      this.pending.clear();
      this.recentOutcomes = [];
      this.health = "reconciling";
      return;
    }
    this.authorityEpoch = state.authorityEpoch;
    this.processedSequenceWatermark = state.processedSequenceWatermark;
    this.health = state.health;
    this.recentOutcomes = structuredClone(state.recentOutcomes).slice(-AiCommandReconciliation.MAX_RECENT_OUTCOMES);
    this.pending.clear();
    for (const commandId of state.pendingCommandIds) {
      const savedPending = state.pendingCommands?.find(
        (entry) => entry.dispatched.commandId === commandId && entry.dispatched.kind === "dispatched"
      );
      const dispatched =
        savedPending?.dispatched ??
        [...state.recentOutcomes]
          .reverse()
          .find((outcome) => outcome.commandId === commandId && outcome.kind === "dispatched");
      if (dispatched) {
        const terminalActorIds = new Set(
          savedPending?.terminalActorIds ??
            state.recentOutcomes
              .filter((outcome) => outcome.commandId === commandId && this.isTerminal(outcome))
              .flatMap((outcome) => [...outcome.actorIds])
        );
        this.pending.set(commandId, {
          dispatched: structuredClone(dispatched),
          lastProgressTick: savedPending?.lastProgressTick ?? currentTick,
          applicationObserved:
            savedPending?.applicationObserved ??
            state.recentOutcomes.some(
              (outcome) =>
                outcome.commandId === commandId && (outcome.kind === "applied" || outcome.kind === "active")
            ),
          terminalActorIds
        });
      }
    }
    if (state.pendingCommandIds.length !== this.pending.size) this.health = "technical_fault";
  }

  destroy(): void {
    this.outcomeSubscription?.unsubscribe();
  }

  private observeOutcome(outcome: GameCommandOutcome): void {
    if (outcome.playerNumber !== this.playerNumber) return;
    if (outcome.authorityEpoch < this.authorityEpoch) return;
    if (outcome.authorityEpoch > this.authorityEpoch) {
      this.authorityEpoch = outcome.authorityEpoch;
      this.pending.clear();
      this.processedSequenceWatermark = -1;
      this.health = "reconciling";
    }
    this.recentOutcomes.push(structuredClone(outcome));
    if (this.recentOutcomes.length > AiCommandReconciliation.MAX_RECENT_OUTCOMES) {
      this.recentOutcomes.splice(0, this.recentOutcomes.length - AiCommandReconciliation.MAX_RECENT_OUTCOMES);
    }
    if (outcome.kind === "dispatched") {
      this.pending.set(outcome.commandId, {
        dispatched: structuredClone(outcome),
        lastProgressTick: outcome.tick,
        applicationObserved: false,
        terminalActorIds: new Set()
      });
      this.enforcePendingBound(outcome.tick);
      this.health = "reconciling";
      return;
    }
    if (outcome.kind === "applied" || outcome.kind === "active") {
      const pending = this.pending.get(outcome.commandId);
      if (pending) {
        pending.applicationObserved = true;
        pending.lastProgressTick = Math.max(pending.lastProgressTick, outcome.tick);
      }
      return;
    }
    if (this.isTerminal(outcome)) {
      const pending = this.pending.get(outcome.commandId);
      outcome.actorIds.forEach((actorId) => pending?.terminalActorIds.add(actorId));
      if (pending) pending.lastProgressTick = Math.max(pending.lastProgressTick, outcome.tick);
      const expectedActorIds = pending?.dispatched.actorIds ?? [];
      const commandSettled =
        !pending ||
        expectedActorIds.length === 0 ||
        expectedActorIds.every((actorId) => pending.terminalActorIds.has(actorId));
      if (!commandSettled) return;
      this.pending.delete(outcome.commandId);
      this.processedSequenceWatermark = Math.max(this.processedSequenceWatermark, outcome.sequence);
      if (this.pending.size === 0 && this.health !== "technical_fault") this.health = "healthy";
    }
  }

  private isTerminal(outcome: GameCommandOutcome): boolean {
    return (
      outcome.kind === "completed" ||
      outcome.kind === "rejected" ||
      outcome.kind === "cancelled" ||
      outcome.kind === "failed"
    );
  }

  private enforcePendingBound(tick: number): void {
    if (this.pending.size <= AiCommandReconciliation.MAX_PENDING) return;
    const overflow = [...this.pending.values()].sort(
      (left, right) =>
        left.dispatched.sequence - right.dispatched.sequence ||
        left.dispatched.commandId.localeCompare(right.dispatched.commandId)
    )[0];
    if (!overflow) return;
    this.health = "technical_fault";
    this.commandBus.reportPersistedOutcome({
      ...overflow.dispatched,
      kind: "failed",
      reason: "outcome_backlog_overflow",
      tick,
      detail: `pending_limit_${AiCommandReconciliation.MAX_PENDING}`
    });
  }
}
