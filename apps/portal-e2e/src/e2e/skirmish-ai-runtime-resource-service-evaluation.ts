import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

type ResourceServiceCheckpoint = Pick<RuntimeCheckpointV1, "tick" | "resourceServiceActors" | "appliedCommands">;
type ResourceServiceVariant = Pick<
  RuntimeVariantResultV1,
  "presetFixtureId" | "presetCreatedActorNames" | "resourceServiceBranch"
> & { readonly checkpoints: readonly ResourceServiceCheckpoint[] };

export function evaluateRuntimeResourceService(
  requirement: NonNullable<RuntimeAssertionV1["requiredResourceService"]>,
  variant: ResourceServiceVariant
): string[] {
  const failures: string[] = [];
  const checkpoints = variant.checkpoints.filter((checkpoint) => checkpoint.tick <= requirement.latestTick);
  const first = checkpoints[0];
  if (!variant.presetFixtureId || !variant.presetCreatedActorNames.includes(requirement.sourceObjectName)) {
    return ["resource_service_preset_missing"];
  }
  const source = first?.resourceServiceActors?.find(
    (actor) => actor.objectName === requirement.sourceObjectName && actor.resourceType === requirement.resourceType
  );
  if (!source) return ["resource_service_source_not_observed"];
  const localServices = (checkpoint: ResourceServiceCheckpoint | undefined) =>
    (checkpoint?.resourceServiceActors ?? []).filter(
      (actor) =>
        actor.relation === "self" &&
        actor.objectName === requirement.serviceObjectName &&
        Math.abs(actor.x - source.x) + Math.abs(actor.y - source.y) <= requirement.maximumTileDistance
    );
  const initial = localServices(first);
  const applied = checkpoints.some((checkpoint) =>
    checkpoint.appliedCommands.some((command) => command.effectId.startsWith("effect:resource-service:"))
  );
  if (variant.resourceServiceBranch === "build") {
    if (initial.some((actor) => actor.ready)) failures.push("resource_service_build_precondition_missing");
    if (!applied) failures.push("resource_service_command_not_applied");
    if (!checkpoints.some((checkpoint) => localServices(checkpoint).some((actor) => actor.ready))) {
      failures.push("resource_service_local_dropoff_not_ready");
    }
  } else if (variant.resourceServiceBranch === "served_control") {
    if (!initial.some((actor) => actor.ready)) failures.push("resource_service_control_precondition_missing");
    if (applied) failures.push("resource_service_unneeded_command");
    if (checkpoints.some((checkpoint) => localServices(checkpoint).length > initial.length)) {
      failures.push("resource_service_unneeded_duplicate");
    }
  } else {
    failures.push("resource_service_branch_missing");
  }
  return failures;
}
