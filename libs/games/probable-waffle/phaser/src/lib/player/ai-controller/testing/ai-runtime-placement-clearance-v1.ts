import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRuntimeProtectedRouteV1 } from "./ai-runtime-protected-route-v1";

/** A fresh static reconstruction from current native map/object/height builders; never a cached planner verdict. */
export interface AiRuntimePlacementClearanceV1 {
  readonly clockTick: number | null;
  readonly snapshotRestoreInProgress: boolean;
  readonly sceneActive: boolean;
  readonly gaps: readonly string[];
  readonly routes: readonly {
    readonly declaration: AiRuntimeProtectedRouteV1;
    readonly fromTile: Vector2Simple;
    readonly toTile: Vector2Simple;
    readonly status: "path" | "blocked" | "unavailable";
    readonly path: readonly Vector2Simple[] | null;
    readonly visitedTiles: number;
    readonly gaps: readonly string[];
  }[];
}
