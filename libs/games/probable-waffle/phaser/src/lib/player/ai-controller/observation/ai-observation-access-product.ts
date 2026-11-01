import Phaser from "phaser";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiObservedAccessProduct, AiObservedActor } from "@fuzzy-waddle/probable-waffle-gameplay";
import { canActorTraverseTile, getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { NavigationService } from "../../../world/services/navigation.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { uniqueDomain } from "./ai-observation-values";

type GameObject = Phaser.GameObjects.GameObject;

type AiAccessCandidate = {
  readonly source: AiObservedActor;
  readonly target: AiObservedActor;
};

function compareObservedGeometry(left: AiObservedActor, right: AiObservedActor): number {
  const leftPosition = left.logicalPosition.status === "known" ? left.logicalPosition.value : null;
  const rightPosition = right.logicalPosition.status === "known" ? right.logicalPosition.value : null;
  if (leftPosition && rightPosition) {
    return leftPosition.y - rightPosition.y || leftPosition.x - rightPosition.x ||
      leftPosition.z - rightPosition.z || left.objectName.localeCompare(right.objectName) ||
      left.actorId.localeCompare(right.actorId);
  }
  if (leftPosition) return -1;
  if (rightPosition) return 1;
  return left.objectName.localeCompare(right.objectName) || left.actorId.localeCompare(right.actorId);
}

/** Keep the bounded query window tied to public geometry, not run-local identity order. */
export function compareAccessProductCandidates(left: AiAccessCandidate, right: AiAccessCandidate): number {
  return compareObservedGeometry(left.source, right.source) || compareObservedGeometry(left.target, right.target);
}

export function projectAccessProduct(
  scene: Phaser.Scene,
  queryInputRevision: number,
  source: AiObservedActor,
  target: AiObservedActor,
  liveById: ReadonlyMap<ActorId, GameObject>,
  tick: number
): AiObservedAccessProduct {
  const sourceNode = source.accessNodeId.status === "known" ? source.accessNodeId.value : undefined;
  const targetNode = target.accessNodeId.status === "known" ? target.accessNodeId.value : undefined;
  const queryId = `query:access:${source.actorId}:${target.actorId}`;
  const sourceActor = liveById.get(source.actorId);
  const targetActor = liveById.get(target.actorId);
  const navigation = getSceneService(scene, NavigationService);
  let status: AiObservedAccessProduct["status"] = "not_ready";
  if (!sourceNode || !targetNode || !sourceActor || !targetActor) {
    status = "unknown";
  } else if (!navigation) {
    status = "service_failed";
  } else {
    const sourceTile = getGameObjectCurrentTile(sourceActor);
    const targetTile = getGameObjectCurrentTile(targetActor);
    if (!sourceTile || !targetTile) {
      status = "unknown";
    } else if (
      !canActorTraverseTile(sourceActor, navigation, sourceTile) ||
      !canActorTraverseTile(sourceActor, navigation, targetTile)
    ) {
      status = "blocked";
    }
  }
  return {
    queryId,
    revision: queryInputRevision,
    status,
    fromNodeId: sourceNode ?? ("access:unknown" as const),
    toNodeId: targetNode ?? ("access:unknown" as const),
    domains: source.capabilities.flatMap((capability) => capability.domains).filter(uniqueDomain),
    updatedTick: tick
  };
}
