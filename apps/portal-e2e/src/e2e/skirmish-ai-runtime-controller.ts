import type { PlayerAiController } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/player-ai-controller";

/** Read-only browser harness surface. Keep return contracts tied to the live controller so checkpoints cannot drift. */
export type RuntimePageControllerV1 = Pick<
  PlayerAiController,
  | "isDecisionBoundarySettled"
  | "getCommittedObservation"
  | "getBrainState"
  | "getCommittedCapabilityCatalog"
  | "getBrainDebugSnapshot"
  | "getBrainDebugHistory"
  | "exportBrainDebugHistory"
  | "getBrainCommandBridgeSnapshot"
>;
