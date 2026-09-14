import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

export function evaluateRuntimeTransport(assertion: RuntimeAssertionV1, variant: RuntimeVariantResultV1): string[] {
  const failures: string[] = [];
  const checkpoints = variant.checkpoints;
  const hasWaterTopology = checkpoints.some(
    (checkpoint) =>
      checkpoint.accessTopology.status === "ready" &&
      checkpoint.accessTopology.waterNodes > 0 &&
      checkpoint.accessTopology.shoreTransfers > 0
  );
  if (assertion.requireWaterTopology && !hasWaterTopology) {
    failures.push(`${variant.variantId}:water_topology_missing`);
  }
  const hasBuildableWaterCarrier = checkpoints.some((checkpoint) =>
    checkpoint.carrierCatalog.some(
      (entry) =>
        entry.capacity > 0 &&
        entry.domains.includes("water") &&
        entry.producerNames.some((producerName) => checkpoint.ownedActorNames.includes(producerName))
    )
  );
  if (assertion.requireBuildableWaterCarrier && !hasBuildableWaterCarrier) {
    failures.push(`${variant.variantId}:buildable_water_carrier_missing`);
  }
  const transportPlans = checkpoints
    .flatMap((checkpoint) => checkpoint.transportPlans)
    .filter((plan) => !assertion.requiredTransportPlanId || plan.planId === assertion.requiredTransportPlanId);
  if (assertion.requireTransportLifecycle && !transportPlans.some((plan) => plan.routeKind === "water_transport")) {
    failures.push(`${variant.variantId}:water_transport_plan_missing`);
  }
  const hasCarrier =
    transportPlans.some((plan) => plan.assignedCapacity > 0 && plan.transportCount > 0) ||
    (!assertion.requiredTransportPlanId &&
      checkpoints.some((checkpoint) =>
        checkpoint.mobileTransports.some((transport) => transport.domains.includes("water"))
      ));
  if (assertion.requireTransportCarrier && !hasCarrier) {
    failures.push(`${variant.variantId}:water_transport_carrier_missing`);
  }
  const boardingPhases = new Set(["boarding", "transit", "landing", "unloading", "regroup", "handoff", "completed"]);
  const hasBoarding =
    transportPlans.some((plan) => boardingPhases.has(plan.phase)) ||
    (!assertion.requiredTransportPlanId &&
      checkpoints.some((checkpoint) =>
        checkpoint.mobileTransports.some(
          (transport) => transport.passengerIds.length > 0 || transport.pendingPassengerIds.length > 0
        )
      ));
  if (assertion.requireTransportBoarding && !hasBoarding) {
    failures.push(`${variant.variantId}:transport_boarding_missing`);
  }
  if (
    assertion.requireTransportHandoff &&
    !transportPlans.some((plan) => plan.phase === "handoff" || plan.phase === "completed")
  ) {
    failures.push(`${variant.variantId}:transport_handoff_missing`);
  }
  return failures;
}
