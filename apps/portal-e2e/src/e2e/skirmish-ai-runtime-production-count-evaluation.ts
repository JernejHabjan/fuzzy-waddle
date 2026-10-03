import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

/** Supplementary aggregate limits; PRO-03/06/07 still require their separate causal evidence contracts. */
export function evaluateRuntimeProductionCounts(assertion: RuntimeAssertionV1, variant: RuntimeVariantResultV1): string[] {
  const failures: string[] = [];
  const maximumProducerCount = Math.max(
    ...variant.checkpoints.map((checkpoint) => checkpoint.militaryProducerNames.length)
  );
  if (
    assertion.minimumMilitaryProducerCount !== undefined &&
    maximumProducerCount < assertion.minimumMilitaryProducerCount
  ) {
    failures.push(`${variant.variantId}:minimum_military_producer_count`);
  }
  if (
    assertion.maximumMilitaryProducerCount !== undefined &&
    maximumProducerCount > assertion.maximumMilitaryProducerCount
  ) {
    failures.push(`${variant.variantId}:maximum_military_producer_count`);
  }
  const compositionDemands = variant.checkpoints.flatMap((checkpoint) =>
    checkpoint.demands.filter((demand) => demand.demandId === "demand:composition:first-squad")
  );
  const capacityDemands = variant.checkpoints.flatMap((checkpoint) =>
    checkpoint.demands.filter((demand) => demand.demandId === "demand:capacity:first-army")
  );
  if (assertion.requireCompositionDemand && compositionDemands.length === 0) {
    failures.push(`${variant.variantId}:composition_demand_missing`);
  }
  if (assertion.requireCapacityDemand && capacityDemands.length === 0) {
    failures.push(`${variant.variantId}:capacity_demand_missing`);
  }
  if (assertion.requireProductionStopsAtTarget) {
    const fulfillmentIndex = variant.checkpoints.findIndex((checkpoint) => {
      const demand = checkpoint.demands.find((candidate) => candidate.demandId === "demand:composition:first-squad");
      return demand !== undefined && demand.satisfied + demand.queued + demand.accepted >= demand.desired;
    });
    if (fulfillmentIndex < 0) failures.push(`${variant.variantId}:composition_target_not_fulfilled`);
    else if (
      variant.checkpoints.slice(fulfillmentIndex).some((checkpoint) => {
        const demand = checkpoint.demands.find((candidate) => candidate.demandId === "demand:composition:first-squad");
        return demand !== undefined && demand.satisfied + demand.queued + demand.accepted > demand.desired;
      })
    ) {
      failures.push(`${variant.variantId}:composition_overproduction`);
    }
  }
  const maximumQueueOccupancy = assertion.maximumQueueOccupancyPerProducer;
  if (
    maximumQueueOccupancy !== undefined &&
    variant.checkpoints.some((checkpoint) =>
      checkpoint.militaryProducerQueues.some((producer) => producer.occupied > maximumQueueOccupancy)
    )
  ) {
    failures.push(`${variant.variantId}:producer_queue_overbooked`);
  }
  return failures;
}
