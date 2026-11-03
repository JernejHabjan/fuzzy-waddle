import { ObjectNames, OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiIntent } from "../../../contracts/commands/ai-intent";
import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { OpeningCheckpoint } from "../opening/ai-opening-catalog";

/** Prefer public geometry and use a stable local identity as the final within-run tie-break. */
export function compareAiActorsByVisibleGeometry(
  left: AiObservation["actors"][number],
  right: AiObservation["actors"][number]
): number {
  const leftPosition = left.logicalPosition.status === "known" ? left.logicalPosition.value : null;
  const rightPosition = right.logicalPosition.status === "known" ? right.logicalPosition.value : null;
  if (leftPosition && rightPosition) {
    return leftPosition.y - rightPosition.y || leftPosition.x - rightPosition.x || leftPosition.z - rightPosition.z ||
      left.objectName.localeCompare(right.objectName) || left.actorId.localeCompare(right.actorId);
  }
  if (leftPosition) return -1;
  if (rightPosition) return 1;
  return left.objectName.localeCompare(right.objectName) || left.actorId.localeCompare(right.actorId);
}

export function owned(observation: AiObservation) {
  return observation.actors
    .filter((actor) => actor.relation === "self" && actor.visibility === "owned")
    .sort(compareAiActorsByVisibleGeometry);
}

export function checkpointActors(
  observation: AiObservation,
  checkpoint: OpeningCheckpoint,
  catalog: AiCapabilityCatalog
) {
  const actors = owned(observation);
  if (checkpoint.id !== "bootstrap-worker") {
    return actors.filter((actor) => actor.objectName === checkpoint.requiredObject);
  }
  return actors.filter((actor) => {
    const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === actor.objectName);
    return actor.objectName === checkpoint.requiredObject || (entry?.gathers.length ?? 0) > 0;
  });
}

export function isFinishedActor(actor: AiObservation["actors"][number]): boolean {
  return actor.constructionProgress?.status !== "known" || actor.constructionProgress.value >= 100;
}

export function queueFree(actor: AiObservation["actors"][number]): boolean {
  return actor.queue.status !== "known" || actor.queue.value.occupied === 0;
}

export function claimedActorIds(intents: readonly AiIntent[]): ReadonlySet<string> {
  return new Set(
    intents.flatMap((intent) => intent.claims.flatMap((claim) => (claim.kind === "actor" ? [claim.actorId] : [])))
  );
}

export function queuedProduction(observation: AiObservation, objectNames: ReadonlySet<ObjectNames>) {
  return owned(observation)
    .flatMap((actor) =>
      actor.queue.status === "known"
        ? (actor.queue.value.items ?? [])
            .filter(
              (item): item is typeof item & { readonly objectName: ObjectNames } =>
                item.kind === "production" && item.objectName !== null && objectNames.has(item.objectName)
            )
            .map((item) => ({ producerId: actor.actorId, itemId: item.itemId, objectName: item.objectName }))
        : []
    )
    .sort((left, right) => left.itemId.localeCompare(right.itemId));
}

export function queuedObjectIds(observation: AiObservation, objectName: ObjectNames): string[] {
  return owned(observation)
    .flatMap((actor) =>
      actor.queue.status === "known"
        ? (actor.queue.value.items ?? [])
            .filter((item) => item.kind === "production" && item.objectName === objectName)
            .map((item) => item.itemId)
        : []
    )
    .sort();
}

export function isAvailableBuilder(actor: AiObservation["actors"][number]): boolean {
  if (actor.resourceTransferInFlight || (actor.carriedResourceAmount ?? 0) > 0) return false;
  // Construction replacement must not strand cargo from a gather/delivery cycle, including partial old-save packs.
  if (
    actor.resourceState.status === "known" &&
    actor.resourceState.value.carried.status === "known" &&
    actor.resourceState.value.carried.value > 0
  )
    return false;
  const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value?.orderType : undefined;
  return order !== OrderType.Build && order !== OrderType.ReturnResources && order !== OrderType.Repair;
}

export function hasAssignedBuilder(observation: AiObservation, siteActorId: string): boolean {
  return owned(observation).some(
    (actor) =>
      actor.activeOrder?.status === "known" &&
      actor.activeOrder.value?.orderType === OrderType.Build &&
      actor.activeOrder.value.targetActorId === siteActorId
  );
}
