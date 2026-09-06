import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiDebugSnapshotV1, AiDebugSectionStateV1 } from "../contracts/ai-debug-snapshot-v1";
import type { AiIntentDecisionV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

const later = (ownerStage: number): AiDebugSectionStateV1 => ({
  status: "not_ready",
  ownerStage,
  reason: `owned_by_stage_${ownerStage}`
});

/** Projects Stage 2 decision facts and honest typed not-ready sections for later owners. */
export function projectAiDebugSnapshot(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  decisions: readonly AiIntentDecisionV1[]
): AiDebugSnapshotV1 {
  const rejected = decisions.filter((decision) => decision.outcome === "rejected");
  const accepted = decisions.filter((decision) => decision.outcome === "accepted");
  const topReasons = [...new Set(decisions.map((decision) => decision.reason))].slice(0, 3);
  const blocker = state.blockers[0] ?? null;

  return {
    schemaVersion: 1,
    playerNumber: state.playerNumber,
    faction: state.faction,
    profileVersion: state.profileVersion,
    archetypeId: state.opening.archetypeId,
    tick: observation.tick,
    generation: observation.generation,
    decisionSequence: state.scheduler.decisionSequence,
    stance: state.strategy.stance,
    goalId: state.strategy.goalId,
    commitmentUntilTick: state.strategy.commitmentDeadline.dueTick,
    topReasons,
    decisions,
    nextActions: accepted.slice(0, 3).map((decision) => decision.intent.kind),
    mainBlockingReason: blocker?.cause ?? rejected[0]?.reason ?? null,
    progressHealth:
      state.authority.health === "technical_fault"
        ? "technical_fault"
        : blocker?.status === "recovering"
          ? "recovering"
          : blocker?.status === "failed_optional"
            ? "failed_optional"
            : blocker
              ? "waiting"
              : "healthy",
    causalIndex: decisions.slice(0, 64).map((decision) => ({
      causeId: decision.intent.intentId,
      causeKind: "intent",
      relatedIds: [
        decision.intent.planId,
        decision.intent.effectId,
        ...decision.intent.claims.map((claim) => claim.claimId)
      ].sort(),
      tick: observation.tick
    })),
    completeness: {
      observation: "complete",
      priorState: "complete",
      outcomes: "complete",
      alternatives: "complete",
      missingRanges: [],
      truncatedEventCount: Math.max(0, decisions.length - 64)
    },
    sections: {
      buildOrder: later(7),
      productionComposition: later(7),
      economyLabor: later(7),
      intelligenceEnvironment: later(9),
      squadsSupport: later(13),
      transport: later(8),
      basesFortifications: later(10),
      decisionsRecovery: { status: "ready", ownerStage: 2, reason: null },
      runtimeLimits: later(6)
    }
  };
}
