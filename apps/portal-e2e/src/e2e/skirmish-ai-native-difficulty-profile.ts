import { ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay";

/** Pinned D-01 contract, deliberately independent of the runtime profile factory so fallback/default drift fails. */
export function nativeDifficultyProfile(branch: string): AiProfileConfigV1 {
  const policies = {
    easy: {
      sourceDifficulty: ProbableWaffleAiDifficulty.Easy, difficulty: "easy", decisionIntervalTicks: 40,
      maxIntentProposalsPerStep: 16, maxAcceptedCommandBatchesPerStep: 4, maxActorOrdersPerStep: 16,
      maxPlacementCandidatesPerStep: 8, maxDetailedPathQueriesPerStep: 2, maxLocalEngagementPairsPerStep: 32,
      maxRouteAlternativesPerOperation: 2, traceHistoryDecisions: 128,
      voluntaryOffensiveMissionLimit: 1, compositionReconsiderationTicks: 80
    },
    normal: {
      sourceDifficulty: ProbableWaffleAiDifficulty.Medium, difficulty: "normal", decisionIntervalTicks: 20,
      maxIntentProposalsPerStep: 32, maxAcceptedCommandBatchesPerStep: 8, maxActorOrdersPerStep: 32,
      maxPlacementCandidatesPerStep: 16, maxDetailedPathQueriesPerStep: 4, maxLocalEngagementPairsPerStep: 64,
      maxRouteAlternativesPerOperation: 4, traceHistoryDecisions: 256,
      voluntaryOffensiveMissionLimit: 2, compositionReconsiderationTicks: 40
    },
    hard: {
      sourceDifficulty: ProbableWaffleAiDifficulty.Hard, difficulty: "hard", decisionIntervalTicks: 10,
      maxIntentProposalsPerStep: 64, maxAcceptedCommandBatchesPerStep: 12, maxActorOrdersPerStep: 48,
      maxPlacementCandidatesPerStep: 24, maxDetailedPathQueriesPerStep: 8, maxLocalEngagementPairsPerStep: 128,
      maxRouteAlternativesPerOperation: 6, traceHistoryDecisions: 256,
      voluntaryOffensiveMissionLimit: 3, compositionReconsiderationTicks: 20
    }
  } as const;
  if (branch !== "easy" && branch !== "normal" && branch !== "hard")
    throw new Error(`native_difficulty_branch_unknown:${branch}`);
  return { schemaVersion: 1, profileVersion: "skirmish-ai-v1", archetypeVersion: "opening-archetypes-v1",
    intentionalErrors: false, cheats: false, ...policies[branch] };
}
