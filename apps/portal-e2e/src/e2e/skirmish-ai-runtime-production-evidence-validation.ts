import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";

function unique(values: readonly string[]): boolean {
  return values.every((value) => value.length > 0) && new Set(values).size === values.length;
}

/** Rejects malformed identities and numeric facts before geometric, timing or payment predicates can accept them. */
export function validateRuntimeProductionEvidence(
  contract: RuntimeProductionContractV1,
  evidence: RuntimeProductionEvidenceV1
): string[] {
  const failures: string[] = [];
  const initial = evidence.snapshots[0];
  if (!initial) return ["production_evidence_missing"];
  const producers = initial.producers.filter((producer) => producer.objectName === contract.producerObjectName);
  if (!unique(evidence.initialProducerIds) || !unique(evidence.initialProductActorIds) || !unique(evidence.initialPaidItemIds) ||
    JSON.stringify([...evidence.initialProducerIds].sort()) !== JSON.stringify(producers.map((producer) => producer.actorId).sort()) ||
    JSON.stringify([...evidence.initialProductActorIds].sort()) !==
      JSON.stringify(initial.products.map((product) => product.actorId).sort()) ||
    evidence.initialPaidItemIds.some((itemId) => !initial.producers.some((producer) =>
      producer.lanes.some((lane) => lane.itemIds.includes(itemId))))) failures.push("production_initial_identity_mismatch");
  if (!unique(evidence.catalog.map((entry) => entry.productKey)) || evidence.catalog.some((entry) =>
    !Number.isSafeInteger(entry.durationTicks) || entry.durationTicks <= 0 ||
    !Object.keys(entry.cost).length || Object.values(entry.cost).some((amount) => !Number.isFinite(amount) || amount < 0))) {
    failures.push("production_catalog_numeric_evidence");
  }
  for (const snapshot of evidence.snapshots) {
    if (!unique(snapshot.producers.map((producer) => producer.actorId)) || !unique(snapshot.products.map((product) => product.actorId)) ||
      !Number.isSafeInteger(snapshot.usefulDemand) || snapshot.usefulDemand < 0 ||
      snapshot.producers.some((producer) => !Number.isFinite(producer.position.x) || !Number.isFinite(producer.position.y) ||
        !unique(producer.lanes.map((lane) => lane.laneId)) || producer.lanes.some((lane) => !unique(lane.itemIds) ||
          !Number.isSafeInteger(lane.capacity) || lane.capacity <= 0 || lane.itemIds.length > lane.capacity)) ||
      snapshot.visibleThreats.some((threat) => !Number.isFinite(threat.position.x) || !Number.isFinite(threat.position.y) ||
        !Number.isFinite(threat.buildingRange) || threat.buildingRange < 0)) failures.push("production_snapshot_numeric_or_identity");
  }
  const creations = evidence.events.flatMap((event) => event.createdActorId ? [event.createdActorId] : []);
  if (!unique(creations)) failures.push("production_duplicate_created_identity");
  const refunded = new Set<string>();
  for (const refund of evidence.events.filter((event) => event.kind === "refund")) {
    const itemId = refund.refundForItemId;
    const cancelled = evidence.events.find((event) => event.kind === "cancel" && event.itemId === itemId &&
      event.actorId === refund.actorId && event.productKey === refund.productKey && event.tick === refund.tick);
    const payments = evidence.events.filter((event) => ["enqueue", "pay"].includes(event.kind) && event.itemId === itemId &&
      event.sequence < refund.sequence && event.actorId === refund.actorId && event.productKey === refund.productKey);
    if (!itemId || !cancelled || !payments.length || refunded.has(itemId) ||
      Object.entries(refund.refundAmounts).some(([resource, amount]) =>
        amount > payments.reduce((total, event) => total + (event.charged[resource] ?? 0), 0))) {
      failures.push("production_refund_identity_or_amount");
    }
    if (itemId) refunded.add(itemId);
  }
  return [...new Set(failures)];
}
