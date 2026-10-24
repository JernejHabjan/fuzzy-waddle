import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

type SourceCheckpoint = Pick<RuntimeCheckpointV1, "tick" | "resourceServiceActors" | "workerOrders">;
type SourceVariant = Pick<RuntimeVariantResultV1, "presetInitialOrderCount" | "presetCreatedActorIds"> & {
  readonly checkpoints: readonly SourceCheckpoint[];
};

export function evaluateRuntimeSourceSaturation(
  requirement: NonNullable<RuntimeAssertionV1["requiredSaturatedSource"]>,
  variant: SourceVariant
): string[] {
  const checkpoints = variant.checkpoints.filter((checkpoint) => checkpoint.tick <= requirement.latestTick);
  const saturatedId = variant.presetCreatedActorIds[requirement.saturatedFixtureActorId];
  const spareId = variant.presetCreatedActorIds[requirement.spareFixtureActorId];
  const sourceSnapshots = checkpoints.flatMap((checkpoint) => checkpoint.resourceServiceActors ?? []);
  const saturated = sourceSnapshots.find(
    (actor) => actor.actorId === saturatedId && actor.resourceType === requirement.resourceType
  );
  const spare = sourceSnapshots.find((actor) => actor.actorId === spareId && actor.resourceType === requirement.resourceType);
  const failures: string[] = [];
  if (variant.presetInitialOrderCount !== requirement.capacity) failures.push("source_saturation_preset_not_applied");
  if (!saturated || saturated.serviceCapacity !== requirement.capacity) {
    failures.push("source_saturation_capacity_not_observed");
  }
  if (!spare || (spare.serviceCapacity ?? 0) < 1) failures.push("source_saturation_spare_not_observed");
  if (!saturated || !spare) return failures;
  const assignedTo = (checkpoint: SourceCheckpoint, actorId: string): number => checkpoint.workerOrders.filter(
    (order) => order.orderType === "Gather" && order.targetActorId === actorId
  ).length;
  if (!checkpoints.some((checkpoint) => assignedTo(checkpoint, saturated.actorId) === requirement.capacity)) {
    failures.push("source_saturation_not_observed");
  }
  if (checkpoints.some((checkpoint) => assignedTo(checkpoint, saturated.actorId) > requirement.capacity)) {
    failures.push("source_saturation_overassigned");
  }
  if (!checkpoints.some((checkpoint) => checkpoint.workerOrders.some(
    (order) => order.orderType === "Gather" && order.targetActorId !== saturated.actorId &&
      sourceSnapshots.some((source) => source.actorId === order.targetActorId &&
        source.resourceType === requirement.resourceType)
  ))) failures.push("source_saturation_spare_unused");
  return failures;
}
