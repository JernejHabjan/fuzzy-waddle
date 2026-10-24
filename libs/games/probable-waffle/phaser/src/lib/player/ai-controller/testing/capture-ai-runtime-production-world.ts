import type Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { LevelComponent } from "../../../entity/components/level/level-component";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { captureAiRuntimeQueueCatalog } from "./capture-ai-runtime-queue-catalog";
import type { AiRuntimeProductionWorldV1 } from "./ai-runtime-production-world-v1";

/** Read-only bounded capture; actors outside the player's index/scene/ownership never supply catalog authority. */
export function captureAiRuntimeProductionWorld(
  scene: Phaser.Scene, playerNumber: number, ownedActors: readonly Phaser.GameObjects.GameObject[]
): AiRuntimeProductionWorldV1 {
  const snapshotRestoreInProgress = isSnapshotApplyInProgress(scene);
  const actors: AiRuntimeProductionWorldV1["actors"][number][] = [];
  const catalog: AiRuntimeProductionWorldV1["catalog"][number][] = [];
  const gaps = new Set<string>();
  if (snapshotRestoreInProgress) gaps.add("production_world_restore_in_progress");
  if (ownedActors.length > 256) return { snapshotRestoreInProgress, actors, catalog, gaps: ["production_world_actor_overflow"] };
  for (const actor of ownedActors) {
    if (actor.scene !== scene) { gaps.add("production_world_owned_identity_invalid"); continue; }
    const captured = captureAiRuntimeCreatedActor(actor);
    if (captured.playerNumber !== playerNumber || !captured.indexed || !captured.actorId) {
      gaps.add("production_world_owned_identity_invalid"); continue;
    }
    const currentLevel = getActorComponent(actor, LevelComponent)?.currentLevel ?? 1;
    if (!Number.isSafeInteger(currentLevel) || currentLevel < 1) { gaps.add("production_world_actor_level_invalid"); continue; }
    actors.push({ ...captured, currentLevel });
    const options = captureAiRuntimeQueueCatalog(actor, captured.actorId, playerNumber);
    options.gaps.forEach((gap) => gaps.add(gap));
    if (catalog.length + options.catalog.length > 512) {
      return { snapshotRestoreInProgress, actors: [], catalog: [], gaps: ["production_world_catalog_overflow"] };
    }
    catalog.push(...options.catalog);
  }
  return { snapshotRestoreInProgress, actors, catalog, gaps: [...gaps].sort() };
}
