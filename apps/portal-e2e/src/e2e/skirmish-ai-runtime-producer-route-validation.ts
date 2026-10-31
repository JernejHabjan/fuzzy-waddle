import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeCreatedActorV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-created-actor-v1";
import type { AiRuntimeProductionSpatialV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-spatial-v1";

/** Validate actual argument/actor/result shapes without treating an endpoint, output branch or path as useful arrival. */
export function validateRuntimeProducerRoute(capture: AiRuntimeProductionCaptureV1, value: AiRuntimeProductionSpatialV1) {
  const integer = (number: number) => Number.isSafeInteger(number) && number >= 0;
  const id = (number: number) => integer(number) && number > 0 && number <= 8192;
  const tile = (point: { readonly x: number; readonly y: number }) => integer(point.x) && integer(point.y);
  const actor = (entry: AiRuntimeCreatedActorV1, owned: boolean) => !!entry.actorId && !!entry.objectName &&
    !!entry.canonicalObjectName && (owned ? entry.playerNumber === capture.playerNumber :
      entry.playerNumber === null || integer(entry.playerNumber)) &&
    [entry.active, entry.alive, entry.finished, entry.indexed].every((flag) => typeof flag === "boolean");
  if (typeof value.snapshotRestoreInProgress !== "boolean" || typeof value.sceneActive !== "boolean") return false;
  if (value.kind === "output") {
    const item = value.item;
    return id(value.outputId) && actor(value.producer, true) && actor(value.product, true) &&
      value.producer.actorId !== value.product.actorId && !!item.itemId && !!item.objectName &&
      item.researchType === null && item.remainingTimeMs === 0 && integer(item.totalTimeMs) &&
      ["command", "capture_local"].includes(item.identitySource) &&
      ["unset", "movement_fallback", "actor_action", "tile_action", "no_target"].includes(value.rallyMode) &&
      (!value.target || actor(value.target, false)) &&
      (!value.targetTile || (tile(value.targetTile) && Number.isFinite(value.targetTile.z))) &&
      (value.rallyMode === "actor_action" ? !!value.target && !value.targetTile : !value.target) &&
      (value.rallyMode === "tile_action" ? !!value.targetTile : !value.targetTile);
  }
  if (value.kind !== "producer_path") return false;
  return typeof value.sourceInCaptureScene === "boolean" &&
    (value.target ? typeof value.targetInCaptureScene === "boolean" : value.targetInCaptureScene === null) &&
    id(value.queryId) && actor(value.source, true) && (!value.target || actor(value.target, false)) &&
    ["producer_service", "product_output"].includes(value.purpose) &&
    (value.purpose === "product_output" ? value.outputId !== null && id(value.outputId) : value.outputId === null &&
      !!value.target && value.target.playerNumber === capture.playerNumber) &&
    ["object_radius", "tile_static", "tile_dynamic"].includes(value.method) &&
    ["requested", "resolved", "threw", "rejected"].includes(value.phase) &&
    (value.method === "object_radius" ? !!value.target && value.target.actorId !== value.source.actorId : !value.target) &&
    (value.sourceTile === null || tile(value.sourceTile)) && (value.targetTile === null || tile(value.targetTile)) &&
    (value.radiusTiles === null || (value.method === "object_radius" &&
      Number.isFinite(value.radiusTiles) && value.radiusTiles >= 0)) &&
    (value.method === "tile_dynamic" ? value.dynamicBlockerCount !== null && integer(value.dynamicBlockerCount) :
      value.dynamicBlockerCount === null) &&
    (value.path === null || value.path.length <= 512 && value.path.every(tile));
}
