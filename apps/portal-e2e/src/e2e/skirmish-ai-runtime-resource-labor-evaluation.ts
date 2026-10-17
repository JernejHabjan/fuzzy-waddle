import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

type LaborCheckpoint = Pick<RuntimeCheckpointV1, "tick" | "resourceServiceActors" | "workerOrders">;
type LaborVariant = Pick<
  RuntimeVariantResultV1,
  "presetInitialOrderCount" | "presetResourceStartCount" | "presetInitialResourceBalances"
> & {
  readonly checkpoints: readonly LaborCheckpoint[];
};

/** Requires an AI-issued order that reaches an observed source, not a forecast or preloaded fixture order. */
export function evaluateRuntimeResourceLabor(
  requirement: NonNullable<RuntimeAssertionV1["requiredResourceLabor"]>,
  variant: LaborVariant
): string[] {
  const failures: string[] = [];
  if (variant.presetResourceStartCount !== 1) failures.push("resource_labor_start_not_applied");
  if (variant.presetInitialResourceBalances[requirement.playerNumber]?.[requirement.resourceType] !== 0) {
    failures.push("resource_labor_zero_balance_missing");
  }
  if (variant.presetInitialOrderCount !== 0) failures.push("resource_labor_has_authored_starting_order");
  const checkpoints = variant.checkpoints.filter((checkpoint) => checkpoint.tick <= requirement.latestTick);
  const sourceIdsAt = (checkpoint: LaborCheckpoint) =>
    new Set(
      (checkpoint.resourceServiceActors ?? [])
        .filter((source) => source.resourceType === requirement.resourceType && source.ready)
        .map((source) => source.actorId)
    );
  if (!checkpoints.some((checkpoint) => sourceIdsAt(checkpoint).size > 0)) {
    failures.push("resource_labor_source_not_observed");
  }
  if (
    !checkpoints.some((checkpoint) => {
      const sourceIds = sourceIdsAt(checkpoint);
      return checkpoint.workerOrders.some(
        (order) => order.orderType === "Gather" && order.targetActorId !== null && sourceIds.has(order.targetActorId)
      );
    })
  )
    failures.push("resource_labor_gather_order_missing");
  return failures;
}
