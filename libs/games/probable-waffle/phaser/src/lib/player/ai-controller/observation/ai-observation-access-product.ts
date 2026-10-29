import Phaser from "phaser";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiObservedAccessProductV1, AiObservedActorV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { canActorTraverseTile, getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { NavigationService } from "../../../world/services/navigation.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { uniqueDomain } from "./ai-observation-values";

type GameObject = Phaser.GameObjects.GameObject;

type AiAccessCandidate = {
  readonly source: AiObservedActorV1;
  readonly target: AiObservedActorV1;
};

function compareObservedGeometry(left: AiObservedActorV1, right: AiObservedActorV1): number {
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
  source: AiObservedActorV1,
  target: AiObservedActorV1,
  liveById: ReadonlyMap<ActorId, GameObject>,
  tick: number
): AiObservedAccessProductV1 {
  const sourceNode = source.accessNodeId.status === "known" ? source.accessNodeId.value : undefined;
  const targetNode = target.accessNodeId.status === "known" ? target.accessNodeId.value : undefined;
  const queryId = `query:access:${source.actorId}:${target.actorId}`;
  const sourceActor = liveById.get(source.actorId);
  const targetActor = liveById.get(target.actorId);
  const navigation = getSceneService(scene, NavigationService);
  let status: AiObservedAccessProductV1["status"] = "not_ready";
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
