import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRuntimeProtectedRoute } from "../navigation/controls/ai-runtime-protected-route";

/** A fresh static reconstruction from current native map/object/height builders; never a cached planner verdict. */
export interface AiRuntimePlacementClearance {
  readonly clockTick: number | null;
  readonly snapshotRestoreInProgress: boolean;
  readonly sceneActive: boolean;
  readonly gaps: readonly string[];
  readonly routes: readonly {
    readonly declaration: AiRuntimeProtectedRoute;
    readonly fromTile: Vector2Simple;
    readonly toTile: Vector2Simple;
    readonly status: "path" | "blocked" | "unavailable";
    readonly path: readonly Vector2Simple[] | null;
    readonly visitedTiles: number;
    readonly gaps: readonly string[];
  }[];
}
