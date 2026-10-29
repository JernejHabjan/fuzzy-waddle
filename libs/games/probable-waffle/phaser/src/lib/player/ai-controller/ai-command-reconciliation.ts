import type { AiCommandReconciliationStateData, GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import { aiDeadline, type AiAuthorityStateV1, type AiCommandOutcomeV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";
import type { Subscription } from "rxjs";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { adaptCommandAuthorityToBrain, adaptGameCommandOutcomesToBrain } from "./ai-command-outcome-adapter";
import { deliverAiCommandOutcome, readAiCommandOutcomeHistory } from "./ai-command-outcome-delivery";
import { isSettlingCommandOutcome } from "../../world/services/multiplayer/is-settling-command-outcome";

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
  private static readonly MAX_RECENT_OUTCOMES = 512;
  private static readonly LOST_OUTCOME_TICKS = 900;
  private static readonly LOST_ACTIVE_OUTCOME_TICKS = 7200;
  private readonly pending = new Map<string, PendingOutcome>();
  private recentOutcomes: GameCommandOutcome[] = [];
  private authorityEpoch = 0;
  private processedSequenceWatermark = -1;
  private health: AiCommandReconciliationStateData["health"] = "healthy";
  private outcomeSubscription?: Subscription;
  private destroyed = false;

  constructor(
    private readonly playerNumber: number,
    private readonly commandBus: CommandBusService,
    private readonly decisionIntervalTicks = 20
  ) {
    if (!Number.isSafeInteger(decisionIntervalTicks) || decisionIntervalTicks < 1)
      throw new Error("ai_reconciliation_invalid_cadence");
    this.authorityEpoch = commandBus.getAuthorityState().authorityEpoch;
    this.outcomeSubscription = commandBus.commandOutcome$.subscribe((outcome) => {
      if (outcome.playerNumber === this.playerNumber)
        deliverAiCommandOutcome(commandBus, outcome, (value) => this.observeOutcome(value));
    });
  }

  observeTick(tick: number): void {
    if (this.destroyed) return;
    const authority = this.commandBus.getAuthorityState();
    const currentAuthorityEpoch = authority.authorityEpoch;
    if (currentAuthorityEpoch > this.authorityEpoch) this.synchronizeAuthority();
    // Query the existing authoritative lifecycle checkpoint, not the present output actor. A completed output may be gone.
    if (tick % this.decisionIntervalTicks === 0 && [...this.pending.values()].some((entry) =>
      tick - entry.dispatched.tick >= 2 * this.decisionIntervalTicks)) {
      const history = readAiCommandOutcomeHistory(this.commandBus, this.playerNumber, authority.outcomes);
      for (const outcome of history ?? []) {
        const pending = this.pending.get(outcome.commandId);
        if (pending && outcome.playerNumber === this.playerNumber && outcome.authorityEpoch === pending.dispatched.authorityEpoch &&
            outcome.sequence === pending.dispatched.sequence && outcome.commitmentKey === pending.dispatched.commitmentKey &&
            outcome.kind !== "dispatched") this.observeOutcome(outcome);
      }
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
    if (expired.length) {
      this.health = "technical_fault";
      // A timeout diagnoses uncertainty. It cannot manufacture a terminal outcome or release an unknown paid effect.
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

  /** A mandatory planner/publication failure is visible across saves; it cannot release uncertain command ownership. */
  markTechnicalFault(): void {
    if (!this.destroyed) this.health = "technical_fault";
  }

  /** Supplies the Stage 2 pure brain with canonical, runtime-free command outcomes. */
  getBrainOutcomes(matchId: GameInstanceId): AiCommandOutcomeV1[] {
    return adaptGameCommandOutcomesToBrain(
      this.recentOutcomes,
      matchId
    );
  }

  /** Supplies the pure brain with the same authority fence used by live application. */
  getBrainAuthorityState(): AiAuthorityStateV1 {
    const oldestPending = [...this.pending.values()].sort(
      (left, right) =>
        left.lastProgressTick - right.lastProgressTick || left.dispatched.sequence - right.dispatched.sequence
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
    if (this.destroyed) throw new Error("ai_reconciliation_disposed");
    const currentAuthorityEpoch = this.commandBus.getAuthorityState().authorityEpoch;
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
              (outcome) => outcome.commandId === commandId && (outcome.kind === "applied" || outcome.kind === "active")
            ),
          terminalActorIds
        });
      }
    }
    if (state.pendingCommandIds.length !== this.pending.size) this.health = "technical_fault";
    if (state.authorityEpoch < currentAuthorityEpoch) this.synchronizeAuthority();
  }

  destroy(): void {
    this.destroyed = true;
    this.outcomeSubscription?.unsubscribe();
  }

  private observeOutcome(outcome: GameCommandOutcome): void {
    if (this.destroyed) return;
    if (outcome.playerNumber !== this.playerNumber) return;
    this.synchronizeAuthority();
    const pendingOriginal = this.pending.get(outcome.commandId)?.dispatched;
    if (outcome.authorityEpoch > this.authorityEpoch) return;
    if (outcome.authorityEpoch < this.authorityEpoch &&
        (!pendingOriginal || outcome.kind === "dispatched" || !this.sameIdentity(pendingOriginal, outcome))) return;
    if (pendingOriginal && !this.sameIdentity(pendingOriginal, outcome)) return;
    if (outcome.kind === "dispatched" && !this.pending.has(outcome.commandId) &&
        outcome.sequence <= this.processedSequenceWatermark) return;
    if (this.recentOutcomes.some((entry) => entry.commandId === outcome.commandId && entry.kind === outcome.kind &&
      entry.tick === outcome.tick && entry.authorityEpoch === outcome.authorityEpoch &&
      entry.sequence === outcome.sequence && entry.reason === outcome.reason &&
      JSON.stringify(entry.actorIds) === JSON.stringify(outcome.actorIds) &&
      JSON.stringify(entry.worldLinkIds) === JSON.stringify(outcome.worldLinkIds))) return;
    // A repeated admission is not new progress. A malformed duplicate cannot replace the original actor set or
    // reset application/terminal progress by reusing the same command identity with different data.
    if (outcome.kind === "dispatched" && this.pending.has(outcome.commandId)) return;
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
      if (this.health !== "technical_fault") this.health = "reconciling";
      this.enforcePendingBound();
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
      if (outcome.authorityEpoch === this.authorityEpoch)
        this.processedSequenceWatermark = Math.max(this.processedSequenceWatermark, outcome.sequence);
      if (this.pending.size === 0 && this.health !== "technical_fault") this.health = "healthy";
    }
  }

  /** Host changes retire unsent work; actual admitted world commitments keep their original age and identity. */
  private synchronizeAuthority(): void {
    const epoch = this.commandBus.getAuthorityEpoch?.() ?? this.commandBus.getAuthorityState().authorityEpoch;
    if (epoch <= this.authorityEpoch) return;
    const authority = this.commandBus.getAuthorityState();
    const admitted = new Set(Object.values(authority.activeCommitmentsByPlayer?.[this.playerNumber] ?? {}));
    for (const id of this.pending.keys()) if (!admitted.has(id)) this.pending.delete(id);
    this.recentOutcomes = this.recentOutcomes.filter((outcome) =>
      outcome.authorityEpoch === authority.authorityEpoch || admitted.has(outcome.commandId) ||
      outcome.kind === "cancelled" && outcome.detail === "authority_epoch_discarded_unsent");
    this.authorityEpoch = authority.authorityEpoch;
    this.processedSequenceWatermark = -1;
    if (this.health !== "technical_fault") this.health = this.pending.size ? "reconciling" : "healthy";
  }

  /** A matching ID alone cannot authorize a different effect/epoch/sequence to release original ownership. */
  private sameIdentity(left: GameCommandOutcome, right: GameCommandOutcome): boolean {
    return left.playerNumber === right.playerNumber && left.authorityEpoch === right.authorityEpoch &&
      left.sequence === right.sequence && left.commitmentKey === right.commitmentKey &&
      left.effectId === right.effectId && left.intentId === right.intentId;
  }

  private isTerminal(outcome: GameCommandOutcome): boolean {
    // A different newly dispatched request may be rejected because the ORIGINAL commitment still owns the purpose.
    // Close only that never-applied request; replay diagnostics on the original admitted command remain non-terminal.
    if (outcome.kind === "rejected" && outcome.reason === "duplicate_command" &&
        outcome.detail?.startsWith("commitment:") && this.pending.get(outcome.commandId)?.applicationObserved === false) {
      const originalId = outcome.detail.slice("commitment:".length);
      if (originalId !== outcome.commandId &&
          this.commandBus.getAuthorityState().activeCommitmentsByPlayer?.[outcome.playerNumber]?.[outcome.commitmentKey] === originalId)
        return true;
    }
    return isSettlingCommandOutcome(outcome);
  }

  private enforcePendingBound(): void {
    if (this.pending.size <= AiCommandReconciliation.MAX_PENDING) return;
    // Admission backpressures new work. Already dispatched obligations survive even an unexpected over-capacity callback.
    this.health = "technical_fault";
  }
}
