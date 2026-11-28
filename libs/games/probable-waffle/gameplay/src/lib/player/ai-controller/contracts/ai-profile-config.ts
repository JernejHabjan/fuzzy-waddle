import type { ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";

/** Fair difficulty policy; it changes tempo/breadth, never visibility or resources. */
export interface AiProfileConfig {
  readonly schemaVersion: 1;
  readonly profileVersion: "skirmish-ai";
  readonly sourceDifficulty: ProbableWaffleAiDifficulty;
  readonly difficulty: "easy" | "normal" | "hard";
  readonly archetypeVersion: "opening-archetypes";
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
