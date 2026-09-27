import Phaser from "phaser";
import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiObservedActorV1, AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ColliderComponent } from "../../../entity/components/movement/collider-component";
import { NavigableComponent } from "../../../entity/components/movement/navigable-component";
import { VisionComponent } from "../../../entity/components/vision-component";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { NavigationService } from "../../../world/services/navigation.service";
import { getSceneComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import { knownValue, unknownValue } from "./ai-observation-values";

type GameObject = Phaser.GameObjects.GameObject;

/** Produces bounded static/topology metadata without exposing hidden occupancy. */
export function projectAiObservationMap(
  scene: Phaser.Scene,
  requestedGeneration: number,
  queryContinuationCursor: number,
  actors: readonly AiObservedActorV1[],
  liveById: ReadonlyMap<ActorId, GameObject>,
  tick: number,
  accessGraph: NonNullable<AiObservationV1["map"]>["accessGraph"],
  permittedTopology: {
    readonly blockedTileKeys: ReadonlySet<string>;
    readonly navigableTileKeys: ReadonlySet<string>;
  }
): NonNullable<AiObservationV1["map"]> {
  const tilemap = getSceneComponent(scene, TilemapComponent)?.tilemap;
  const navigation = getSceneService(scene, NavigationService);
  const ownedNodes = actors
    .filter((actor) => actor.visibility === "owned" && actor.accessNodeId.status === "known")
    .map((actor) => (actor.accessNodeId.status === "known" ? actor.accessNodeId.value : null))
    .filter((node): node is `access:${string}` => node !== null)
    .sort();
  const dynamicObstacleActorIds = actors
    .filter((actor) => actor.visibility !== "last_seen")
    .filter((actor) => {
      const liveActor = liveById.get(actor.actorId);
      return liveActor ? getActorComponent(liveActor, ColliderComponent)?.colliderDefinition?.enabled === true : false;
    })
    .map((actor) => actor.actorId)
    .sort();
  const scoutCoverageAccessNodeIds = [
    ...new Set(
      actors
        .filter((actor) => actor.visibility === "owned" && actor.accessNodeId.status === "known")
        .filter((actor) => {
          const liveActor = liveById.get(actor.actorId);
          return liveActor ? getActorComponent(liveActor, VisionComponent) !== undefined : false;
        })
        .map((actor) => (actor.accessNodeId.status === "known" ? actor.accessNodeId.value : null))
        .filter((node): node is `access:${string}` => node !== null)
    )
  ].sort();
  const constructionCells: Array<NonNullable<NonNullable<AiObservationV1["map"]>["constructionCells"]>[number]> = [];
  const mainAnchors = actors
    .filter(
      (actor) => actor.visibility === "owned" && actor.mainBuilding?.status === "known" && actor.mainBuilding.value
    )
    .filter((actor) => actor.logicalPosition.status === "known")
    .map((actor) =>
      actor.logicalPosition.status === "known"
        ? {
            ...actor.logicalPosition.value,
            x: Math.round(actor.logicalPosition.value.x),
            y: Math.round(actor.logicalPosition.value.y)
          }
        : null
    )
    .filter((position): position is Vector3Simple => position !== null)
    .sort((left, right) => left.y - right.y || left.x - right.x)
    .slice(0, 4);
  const visibleSources = actors.filter(
    (actor) =>
      actor.visibility === "visible" &&
      actor.resourceState.status === "known" &&
      actor.resourceState.value.available.status === "known" &&
      actor.resourceState.value.available.value > 0 &&
      actor.logicalPosition.status === "known"
  );
  const serviceAnchors = actors
    .filter((actor) => actor.visibility === "owned" && actor.logicalPosition.status === "known")
    .flatMap((actor) => {
      const liveActor = liveById.get(actor.actorId);
      const vision = liveActor ? getActorComponent(liveActor, VisionComponent) : undefined;
      if (!vision) return [];
      const ownedPosition = actor.logicalPosition.status === "known" ? actor.logicalPosition.value : null;
      const nearSource = visibleSources.some((source) => {
        const sourcePosition = source.logicalPosition.status === "known" ? source.logicalPosition.value : null;
        return (
          ownedPosition !== null &&
          sourcePosition !== null &&
          Math.abs(ownedPosition.x - sourcePosition.x) + Math.abs(ownedPosition.y - sourcePosition.y) <= vision.range
        );
      });
      return nearSource && ownedPosition
        ? [{ position: ownedPosition, radius: Math.min(4, Math.floor(vision.range)) }]
        : [];
    })
    .sort((left, right) => left.position.y - right.position.y || left.position.x - right.position.x)
    .slice(0, 4);
  const anchors = [...mainAnchors.map((position) => ({ position, radius: 12 })), ...serviceAnchors];
  const included = new Set<string>();
  if (tilemap && navigation) {
    anchorCells: for (const anchor of anchors) {
      for (
        let y = Math.max(0, anchor.position.y - anchor.radius);
        y <= Math.min(tilemap.height - 1, anchor.position.y + anchor.radius);
        y += 1
      ) {
        for (
          let x = Math.max(0, anchor.position.x - anchor.radius);
          x <= Math.min(tilemap.width - 1, anchor.position.x + anchor.radius);
          x += 1
        ) {
          if (constructionCells.length >= 2_048) break anchorCells;
          const tileKey = `${x},${y}`;
          if (included.has(tileKey)) continue;
          included.add(tileKey);
          const observedNavigable = permittedTopology.navigableTileKeys.has(tileKey);
          const observedBlocked = permittedTopology.blockedTileKeys.has(tileKey);
          constructionCells.push({
            tileKey,
            position: { x, y, z: 0 },
            groundPassable: !observedBlocked && navigation.isTileGridWithoutBlockingObjectsNavigable({ x, y }),
            waterPassable: navigation.isTileNavigable({ x, y }, MovementTerrainType.Water),
            elevation: observedNavigable ? (navigation.getNavigableHeightAtTile({ x, y }) ?? 0) : 0,
            observedBlocked
          });
        }
      }
    }
  }
  const tacticalCells: typeof constructionCells = [];
  if (tilemap && navigation) {
    const targets = actors
      .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible")
      .filter((actor) => actor.logicalPosition.status === "known")
      .sort((left, right) => {
        const priority = (actor: AiObservedActorV1) =>
          actor.mainBuilding?.status === "known" && actor.mainBuilding.value
            ? 0
            : actor.capabilities.some((capability) => capability.family === "produce")
              ? 1
              : 2;
        return priority(left) - priority(right) || left.actorId.localeCompare(right.actorId);
      })
      .slice(0, 12);
    const includedTactical = new Set<string>();
    for (const target of targets) {
      if (target.logicalPosition.status !== "known") continue;
      const center = target.logicalPosition.value;
      for (
        let y = Math.max(0, Math.round(center.y) - 6);
        y <= Math.min(tilemap.height - 1, Math.round(center.y) + 6);
        y += 1
      ) {
        for (
          let x = Math.max(0, Math.round(center.x) - 6);
          x <= Math.min(tilemap.width - 1, Math.round(center.x) + 6);
          x += 1
        ) {
          if (tacticalCells.length >= 1_024) break;
          const tileKey = `${x},${y}`;
          if (includedTactical.has(tileKey)) continue;
          includedTactical.add(tileKey);
          const observedNavigable = permittedTopology.navigableTileKeys.has(tileKey);
          const observedBlocked = permittedTopology.blockedTileKeys.has(tileKey);
          tacticalCells.push({
            tileKey,
            position: { x, y, z: observedNavigable ? (navigation.getNavigableHeightAtTile({ x, y }) ?? 0) : 0 },
            groundPassable:
              !observedBlocked && (observedNavigable || navigation.isTileGridWithoutBlockingObjectsNavigable({ x, y })),
            waterPassable: navigation.isTileNavigable({ x, y }, MovementTerrainType.Water),
            elevation: observedNavigable ? (navigation.getNavigableHeightAtTile({ x, y }) ?? 0) : 0,
            observedBlocked
          });
        }
      }
    }
  }
  return {
    bounds: tilemap
      ? knownValue({ width: tilemap.width, height: tilemap.height }, tick)
      : unknownValue("not_supported"),
    // Tilemap content is immutable for a loaded match; topology changes belong
    // to the independently versioned dynamic-query stream.
    staticRevision: tilemap ? 1 : 0,
    // A frontier is an admitted static region outside currently covered vision, not
    // merely the AI's own node. Dynamic unknowns remain absent from this fair input.
    frontierAccessNodeIds: (accessGraph?.nodes ?? [])
      .filter((candidate) => candidate.knowledge === "known_static" && !ownedNodes.includes(candidate.nodeId))
      .map((candidate) => candidate.nodeId)
      .sort(),
    scoutCoverageAccessNodeIds,
    dynamicObstacleActorIds,
    regionGeneration: {
      generation: accessGraph?.generation ?? requestedGeneration,
      status: accessGraph?.status === "ready" ? "ready" : tilemap ? "not_ready" : "service_failed",
      continuationCursor: accessGraph?.continuationCursor ?? queryContinuationCursor
    },
    constructionCells,
    tacticalCells,
    ...(accessGraph ? { accessGraph } : {})
  };
}

/** Hashes only owned/visible topology actors so hidden movement cannot invalidate the AI graph. */
export function permittedAiObservationTopology(
  scene: Phaser.Scene,
  actors: readonly AiObservedActorV1[],
  liveById: ReadonlyMap<ActorId, GameObject>
): {
  readonly revision: number;
  readonly blockedTileKeys: ReadonlySet<string>;
  readonly navigableTileKeys: ReadonlySet<string>;
} {
  const tilemap = getSceneComponent(scene, TilemapComponent)?.tilemap;
  const blockedTileKeys = new Set<string>();
  const navigableTileKeys = new Set<string>();
  if (tilemap) {
    scene.children.each((child) => {
      if (!getActorComponent(child, NavigableComponent) || getActorComponent(child, OwnerComponent)) return;
      const footprint = getTileCoordsUnderObject(tilemap, child);
      if (footprint.length === 0) return;
      const { shrinkX, shrinkY } = NavigableComponent.handleNavigable(child);
      const minX = Math.min(...footprint.map((tile) => tile.x));
      const maxX = Math.max(...footprint.map((tile) => tile.x));
      const minY = Math.min(...footprint.map((tile) => tile.y));
      const maxY = Math.max(...footprint.map((tile) => tile.y));
      for (const tile of footprint) {
        if (tile.x < minX + shrinkX || tile.x > maxX - shrinkX) continue;
        if (tile.y < minY + shrinkY || tile.y > maxY - shrinkY) continue;
        navigableTileKeys.add(`${tile.x},${tile.y}`);
      }
    });
  }
  const input = actors
    .filter((actor) => actor.visibility !== "last_seen")
    .flatMap((actor) => {
      const liveActor = liveById.get(actor.actorId);
      if (!liveActor) return [];
      const collider = getActorComponent(liveActor, ColliderComponent)?.colliderDefinition?.enabled === true;
      const navigableComponent = getActorComponent(liveActor, NavigableComponent);
      const navigable = navigableComponent !== undefined;
      if (!collider && !navigable) return [];
      const tile = getGameObjectCurrentTile(liveActor);
      if (tilemap) {
        for (const occupiedTile of getTileCoordsUnderObject(tilemap, liveActor)) {
          const key = `${occupiedTile.x},${occupiedTile.y}`;
          if (collider) blockedTileKeys.add(key);
          if (navigable) navigableTileKeys.add(key);
        }
      }
      const pathSignature = navigableComponent
        ? (["top", "bottom", "left", "right", "topLeft", "topRight", "bottomLeft", "bottomRight"] as const)
            .map((direction) => {
              const port = navigableComponent.getDirectionPort(direction);
              return `${direction}:${port?.enterHeight ?? "x"}:${port?.exitHeight ?? "x"}`;
            })
            .join(",")
        : "";
      return tile
        ? [`${actor.actorId}:${tile.x}:${tile.y}:${collider ? 1 : 0}:${navigable ? 1 : 0}:${pathSignature}`]
        : [];
    })
    .sort()
    .join("|");
  let hash = 0x811c9dc5;
  const source = `${tilemap?.width ?? 0}:${tilemap?.height ?? 0}:${input}:${[...navigableTileKeys].sort().join("|")}`;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return { revision: hash >>> 0, blockedTileKeys, navigableTileKeys };
}
