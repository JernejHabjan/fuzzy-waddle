import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiObservation } from "../contracts/ai-observation";
import type { AiDebugSnapshot, AiDebugSectionState } from "../contracts/ai-debug-snapshot";

/** Honest empty diagnostic projection. Never retries the failing projector or re-runs a planner to fill missing panels. */
export function aiDebugFailureSnapshot(observation: AiObservation, state: AiBrainState): AiDebugSnapshot {
  const missing = { status: "not_ready", ownerSubsystem: "debug", reason: "debug_projection_fault" } satisfies AiDebugSectionState;
  return {
    schemaVersion: 1, playerNumber: state.playerNumber, faction: state.faction, profileVersion: state.profileVersion,
    profileDifficulty: state.profileDifficulty ?? "unknown", archetypeId: state.opening.archetypeId,
    tick: observation.tick, generation: observation.generation, decisionSequence: state.scheduler.decisionSequence,
    stance: state.strategy.stance, goalId: state.strategy.goalId, commitmentUntilTick: state.strategy.commitmentDeadline.dueTick,
    topReasons: ["debug_projection_fault"], decisions: [], nextActions: [], mainBlockingReason: "debug_projection_fault",
    strategicIntentSummary: { headline: "Diagnostics unavailable", objective: "Not recorded", force: "Not recorded",
      production: "Not recorded", economy: "Not recorded", blocker: "debug_projection_fault", nextAction: "Not recorded" },
    whyNot: [], transportOperations: [], bases: [], fortifications: [], recovery: [], support: [],
    skirmish: { questions: [], incidents: [], squads: [], timeline: [],
      mode: { state: "not_recorded", hopelessSinceTick: null, concessionIntentId: null, reason: "debug_projection_fault" } },
    adaptation: { evidence: [], roleTargets: [], lastTransitionTick: null, lastTransitionReason: null,
      selectedResearchType: null, selectedResearchScore: null, cancellationPolicy: "not_recorded" },
    runtimeLimits: { decisionSequence: state.scheduler.decisionSequence, continuationCursors: [], laneService: [],
      retainedTraceDecisions: 0 },
    progressHealth: state.authority.health === "technical_fault" ? "technical_fault" : "failed_optional",
    causalIndex: [], completeness: { observation: "complete", priorState: "complete", outcomes: "complete",
      alternatives: "not_recorded", missingRanges: [{ fromTick: observation.tick, toTick: observation.tick }], truncatedEventCount: 0 },
    sections: { buildOrder: missing, productionComposition: missing, economyLabor: missing,
      intelligenceEnvironment: missing, squadsSupport: missing, transport: missing, basesFortifications: missing,
      decisionsRecovery: missing, runtimeLimits: missing }
  };
}
