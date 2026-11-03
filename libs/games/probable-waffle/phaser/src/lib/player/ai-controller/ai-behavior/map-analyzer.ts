import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";

/** Legacy blackboard map shape retained as data compatibility only; no map planner executes it. */
export interface MapAnalysis {
  baseCenterTile?: Vector3Simple;
  candidateBuildSpots: Vector3Simple[];
  analyzedAtMs: number;
}
