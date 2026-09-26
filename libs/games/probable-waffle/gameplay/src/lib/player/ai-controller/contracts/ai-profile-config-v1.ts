import type { ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";

/** Versioned fair difficulty policy; it changes tempo/breadth, never visibility or resources. */
export interface AiProfileConfigV1 {
  readonly schemaVersion: 1;
  readonly profileVersion: "skirmish-ai-v1";
  readonly sourceDifficulty: ProbableWaffleAiDifficulty;
  readonly difficulty: "easy" | "normal" | "hard";
  readonly archetypeVersion: "opening-archetypes-v1";
  readonly decisionIntervalTicks: number;
  readonly maxIntentProposalsPerStep: number;
  readonly maxAcceptedCommandBatchesPerStep: number;
  readonly maxActorOrdersPerStep: number;
  readonly maxPlacementCandidatesPerStep: number;
  readonly maxDetailedPathQueriesPerStep: number;
  readonly maxLocalEngagementPairsPerStep: number;
  readonly maxRouteAlternativesPerOperation: number;
  readonly traceHistoryDecisions: number;
  readonly voluntaryOffensiveMissionLimit: number;
  readonly compositionReconsiderationTicks: number;
  readonly intentionalErrors: false;
  readonly cheats: false;
}
