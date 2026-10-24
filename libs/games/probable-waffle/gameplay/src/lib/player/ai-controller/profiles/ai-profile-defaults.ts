import { ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";

const base = {
  schemaVersion: 1,
  profileVersion: "skirmish-ai-v1",
  archetypeVersion: "opening-archetypes-v1",
  intentionalErrors: false,
  cheats: false
} as const;

/** Resolves lobby difficulty to a complete, versioned and fair planning profile. */
export function createAiProfileConfigV1(difficulty: ProbableWaffleAiDifficulty): AiProfileConfigV1 {
  switch (difficulty) {
    case ProbableWaffleAiDifficulty.Easy:
      return {
        ...base,
        sourceDifficulty: difficulty,
        difficulty: "easy",
        decisionIntervalTicks: 40,
        maxIntentProposalsPerStep: 16,
        maxAcceptedCommandBatchesPerStep: 4,
        maxActorOrdersPerStep: 16,
        maxPlacementCandidatesPerStep: 8,
        maxDetailedPathQueriesPerStep: 2,
        maxLocalEngagementPairsPerStep: 32,
        maxRouteAlternativesPerOperation: 2,
        traceHistoryDecisions: 128,
        voluntaryOffensiveMissionLimit: 1,
        compositionReconsiderationTicks: 80
      };
    case ProbableWaffleAiDifficulty.Medium:
      return {
        ...base,
        sourceDifficulty: difficulty,
        difficulty: "normal",
        decisionIntervalTicks: 20,
        maxIntentProposalsPerStep: 32,
        maxAcceptedCommandBatchesPerStep: 8,
        maxActorOrdersPerStep: 32,
        maxPlacementCandidatesPerStep: 16,
        maxDetailedPathQueriesPerStep: 4,
        maxLocalEngagementPairsPerStep: 64,
        maxRouteAlternativesPerOperation: 4,
        traceHistoryDecisions: 256,
        voluntaryOffensiveMissionLimit: 2,
        compositionReconsiderationTicks: 40
      };
    case ProbableWaffleAiDifficulty.Hard:
      return {
        ...base,
        sourceDifficulty: difficulty,
        difficulty: "hard",
        decisionIntervalTicks: 10,
        maxIntentProposalsPerStep: 64,
        maxAcceptedCommandBatchesPerStep: 12,
        maxActorOrdersPerStep: 48,
        maxPlacementCandidatesPerStep: 24,
        maxDetailedPathQueriesPerStep: 8,
        maxLocalEngagementPairsPerStep: 128,
        maxRouteAlternativesPerOperation: 6,
        traceHistoryDecisions: 256,
        voluntaryOffensiveMissionLimit: 3,
        compositionReconsiderationTicks: 20
      };
    default:
      throw new Error("unsupported_ai_difficulty");
  }
}
