import type Phaser from "phaser";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { HeightNavigationGraphBuilder } from "../../../world/services/height-navigation-graph-builder";
import { NavigationObjectGrid } from "../../../world/services/navigation-object-grid";
import { TerrainGridBuilder } from "../../../world/services/terrain-grid-builder";
import { getSceneComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { ActorTranslateComponent } from "../../../entity/components/movement/actor-translate-component";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import { getActorComponent } from "../../../data/actor-component";
import type { AiRuntimeProtectedRouteV1 } from "./ai-runtime-protected-route-v1";
import type { AiRuntimePlacementClearanceV1 } from "./ai-runtime-placement-clearance-v1";
import { findAiRuntimeClearancePath } from "./find-ai-runtime-clearance-path";

/** Opt-in test projection. Rebuilds current native static geometry without touching the live graph, cache or timers. */
export function captureAiRuntimePlacementClearance(
  scene: Phaser.Scene, declarations: readonly AiRuntimeProtectedRouteV1[]
): AiRuntimePlacementClearanceV1 {
  const clockTick = getSceneService(scene, SimulationTickService)?.currentTick ?? null;
  const boundary = { clockTick, snapshotRestoreInProgress: isSnapshotApplyInProgress(scene),
    sceneActive: scene.sys?.isActive() ?? false };
  const missing = (gap: string): AiRuntimePlacementClearanceV1 => ({ ...boundary, gaps: [gap], routes: [] });
  if (clockTick === null || boundary.snapshotRestoreInProgress || !boundary.sceneActive) {
    return missing("placement_clearance_boundary_unavailable");
  }
  if (!declarations.length || declarations.length > 8) return missing("placement_clearance_scope_invalid");
  try {
    const map = getSceneComponent(scene, TilemapComponent);
    if (!map || map.data.reduce((count, row) => count + row.length, 0) > 16384 || scene.children.length > 512) {
      return missing("placement_clearance_world_unavailable_or_overflow");
    }
    const ground = TerrainGridBuilder.buildGroundGrid(map.data);
    const objects = new NavigationObjectGrid(scene, map.tilemap, false).build(
      ground,
      (actor) => actor.active && actor.scene === scene && !getActorComponent(actor, ActorTranslateComponent)
    );
    const grid = ground.map((row, y) => row.map((tile, x) => objects[y]?.[x] ?? tile));
    const graph = new HeightNavigationGraphBuilder(scene, map.tilemap).build(grid);
    return { ...boundary, gaps: [], routes: declarations.map((declaration) => {
      const fromTile = IsoHelper.isometricWorldToTileXY(scene, declaration.from.x, declaration.from.y);
      const toTile = IsoHelper.isometricWorldToTileXY(scene, declaration.to.x, declaration.to.y);
      return { declaration: structuredClone(declaration), fromTile, toTile,
        ...findAiRuntimeClearancePath(graph, fromTile, toTile, declaration.tileMargin) };
    }) };
  } catch {
    return missing("placement_clearance_native_reader_failed");
  }
}
