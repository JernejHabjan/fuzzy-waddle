import { NavigationService } from "../../../world/services/navigation.service";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { LevelComponent } from "../../../entity/components/level/level-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { captureAiRuntimeProductionQueue } from "./ai-runtime-production-queues";

/** Only pinned owned output/producer identities are read. No live enemy discovery or path probes occur here. */
export function captureAiRuntimeProductionFrontier(
  scene: ProbableWaffleScene,
  playerNumber: number,
  actorIds: ReadonlySet<string>,
  identify: (actorId: string, item: UnifiedQueueItem) => string,
  afterSequence: number
) {
  const index = getSceneService(scene, ActorIndexSystem);
  const tech = getSceneService(scene, TechTreeService);
  if (!index || !tech || actorIds.size > 256 || isSnapshotApplyInProgress(scene)) {
    throw new Error("production_frontier_authority_unavailable");
  }
  const actors = [...actorIds].sort().flatMap((id) => {
    const actor = index.getActorById(id);
    if (!actor || actor.scene !== scene) return [];
    const identity = captureAiRuntimeCreatedActor(actor);
    if (identity.playerNumber !== playerNumber || identity.actorId !== id) {
      throw new Error("production_frontier_identity_changed");
    }
    return [{ actor, identity }];
  });
  return {
    afterSequence,
    actors: actors.map(({ actor, identity }) => ({
      identity,
      position: getGameObjectLogicalTransform(actor),
      tile: getGameObjectCurrentTile?.(actor) ?? null,
      level: getActorComponent(actor, LevelComponent)?.currentLevel ?? 1
    })),
    queues: actors.flatMap(({ actor }) => {
      const queue = captureAiRuntimeProductionQueue(actor, identify);
      return queue
        ? [
            {
              actorId: queue.actorId,
              objectName: queue.objectName,
              lanes: queue.lanes.map((lane) => ({
                laneId: lane.laneId,
                capacity: lane.capacity,
                itemIds: lane.items.map((item) => item.itemId)
              }))
            }
          ]
        : [];
    }),
    navigation: getSceneService(scene, NavigationService)?.getNativeNavigationBoundary?.() ?? null,
    completedResearch: [...tech.getPlayerResearch(playerNumber)].sort()
  };
}
