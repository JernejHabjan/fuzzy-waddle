import type Phaser from "phaser";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessGraph, AiObservedActor, AiObservation } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getActorComponent } from "../../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../../data/game-object-helper";
import { VisionComponent } from "../../../../entity/components/vision-component";

/** Region presence is not vision coverage. Test each static representative against actual owned vision geometry. */
export function projectAiScoutCoverage(
  graph: AiAccessGraph | undefined,
  actors: readonly AiObservedActor[],
  liveById: ReadonlyMap<ActorId, Phaser.GameObjects.GameObject>
) {
  const sources = ownedVisionSources(actors, liveById);
  return (graph?.nodes ?? [])
    .filter(
      (node) =>
        node.knowledge === "known_static" &&
        sources.some(
          (source) =>
            Math.floor(
              Math.hypot(source.tile.x - node.representativePosition.x, source.tile.y - node.representativePosition.y)
            ) <= source.range
        )
    )
    .map((node) => node.nodeId)
    .sort();
}

/** Samples current owned vision at cached search destinations; remembered coverage belongs to knowledge questions. */
export function observeAiScoutSearchPoints(
  points: NonNullable<NonNullable<AiObservation["map"]>["scoutSearchPoints"]>,
  actors: readonly AiObservedActor[],
  liveById: ReadonlyMap<ActorId, Phaser.GameObjects.GameObject>
) {
  const sources = ownedVisionSources(actors, liveById);
  return points.map((point) => ({
    ...point,
    observed: sources.some(
      (source) =>
        Math.floor(Math.hypot(source.tile.x - point.position.x, source.tile.y - point.position.y)) <= source.range
    )
  }));
}

function ownedVisionSources(
  actors: readonly AiObservedActor[],
  liveById: ReadonlyMap<ActorId, Phaser.GameObjects.GameObject>
) {
  return actors
    .filter((actor) => actor.relation === "self" && actor.visibility === "owned")
    .flatMap((actor) => {
      const live = liveById.get(actor.actorId);
      const vision = live ? getActorComponent(live, VisionComponent) : undefined;
      const tile = live && vision ? getGameObjectCurrentTile(live) : undefined;
      return tile && vision ? [{ tile, range: vision.range }] : [];
    });
}
