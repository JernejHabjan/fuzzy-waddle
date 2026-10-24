import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";

/** Optional future abandonment releases only unspent claims and cannot erase admitted or paid work. */
export function evaluateRuntimeProductionAbandonment(
  contract: RuntimeProductionContractV1,
  evidence: RuntimeProductionEvidenceV1,
  committed: RuntimeProductionEvidenceV1["snapshots"][number]
): string[] {
  const { snapshots, events } = evidence;
  const transition = committed.transition;
  if (!transition) return ["production_transition_initial_commitment"];
  const failures: string[] = [];
  const construction = events.filter(
    (event) => event.kind === "construct" && event.productKey === contract.producerObjectName
  );
  const abandoned = snapshots.find((snapshot) => snapshot.transition?.status === "abandoned");
  if (
    !abandoned ||
    abandoned.tick >= transition.beginsTick ||
    snapshots
      .filter((snapshot) => snapshot.tick >= (abandoned?.tick ?? Infinity))
      .some((snapshot) => snapshot.transition?.status !== "abandoned")
  ) {
    failures.push("production_transition_abandonment_missing");
    return failures;
  }
  const unspent = committed.leases.filter(
    (lease) => lease.planId === transition.planId && lease.optional && ["forecast", "provisional"].includes(lease.state)
  );
  if (!unspent.length) failures.push("production_transition_optional_lease_missing");
  const irreversible = committed.leases.filter((lease) => !["forecast", "provisional"].includes(lease.state));
  const retained = snapshots.filter((snapshot) => snapshot.tick >= abandoned.tick);
  if (
    retained.some((snapshot) =>
      snapshot.leases.some((lease) => unspent.some((prior) => prior.claimId === lease.claimId))
    )
  )
    failures.push("production_transition_unspent_not_released");
  if (
    retained.some((snapshot) =>
      irreversible.some(
        (lease) =>
          !snapshot.leases.some((current) => current.claimId === lease.claimId && current.state === lease.state)
      )
    )
  ) {
    failures.push("production_transition_spent_claim_released");
  }
  if (
    construction.length ||
    events.some(
      (event) => event.planId === transition.planId && ["construct", "enqueue", "cancel", "refund"].includes(event.kind)
    )
  ) {
    failures.push("production_transition_abandoned_spending");
  }
  if (
    retained.some((snapshot) =>
      snapshot.producers.some(
        (producer) =>
          producer.objectName === contract.producerObjectName && !evidence.initialProducerIds.includes(producer.actorId)
      )
    )
  ) {
    failures.push("production_transition_abandoned_capacity");
  }
  return failures;
}
