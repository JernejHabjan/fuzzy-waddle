import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

/** Requires an actual ready producer for deficit cases and a full-window absence for ample-capacity controls. */
export function evaluateRuntimeProductionCapacity(
  scenarioId: string,
  assertion: RuntimeAssertionV1["requiredProductionCapacity"],
  variant: RuntimeVariantResultV1
): string[] {
  if (!assertion) return [];
  const producerName = assertion.producerObjectNameByFaction[variant.aiFaction];
  const initial = variant.presetCreatedActorNames.filter((name) => name === producerName).length;
  const expectedInitial = variant.productionCapacityBranch === "build" ? 1 : 2;
  const failures: string[] = [];
  if (!variant.presetFixtureId || initial !== expectedInitial) failures.push("production_capacity_initial_setup");
  const checkpoints = variant.checkpoints.filter((checkpoint) => checkpoint.tick <= assertion.latestTick);
  const counts = checkpoints.map((checkpoint) => checkpoint.militaryProducerNames.filter((name) => name === producerName).length);
  const firstReady = counts.findIndex((count) => count >= 2);
  if (firstReady < 0) failures.push("production_capacity_not_ready");
  if (counts.some((count) => count > 2)) failures.push("production_capacity_unnecessary_duplicate");
  if (!checkpoints.some((checkpoint) => checkpoint.demands.some(
    (demand) => demand.demandId === "demand:capacity:first-army" && demand.desired === 2
  ))) failures.push("production_capacity_dated_demand_missing");
  if (scenarioId === "PRO-03" && variant.productionCapacityBranch === "build" && firstReady >= 0) {
    const demand = checkpoints[firstReady]?.demands.find(
      (candidate) => candidate.demandId === "demand:composition:first-squad"
    );
    if (!demand || demand.satisfied + demand.queued + demand.constructing + demand.accepted >= demand.desired) {
      failures.push("production_capacity_not_prebuilt");
    }
  }
  if (!variant.productionCapacityBranch) failures.push("production_capacity_branch_missing");
  return failures;
}
