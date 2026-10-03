import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";

/** Exposure needs a currently visible effective building weapon; hidden/global threat summaries are insufficient. */
function exposed(
  producer: RuntimeProductionEvidenceV1["snapshots"][number]["producers"][number],
  snapshot: RuntimeProductionEvidenceV1["snapshots"][number]
): boolean {
  return snapshot.visibleThreats.some((threat) => threat.observedTick === snapshot.tick && threat.buildingRange > 0 &&
    Math.hypot(producer.position.x - threat.position.x, producer.position.y - threat.position.y) <= threat.buildingRange);
}

/** Critical exposed throughput requires a new safe identity before loss and useful applied output after loss. */
export function evaluateRuntimeProducerResilience(
  contract: RuntimeProductionContractV1,
  evidence: RuntimeProductionEvidenceV1
): string[] {
  const { snapshots, events } = evidence;
  const initial = snapshots[0];
  if (!initial) return ["producer_resilience_initial_setup"];
  const producers = initial.producers.filter((producer) => producer.objectName === contract.producerObjectName && producer.ready);
  const initialProducer = producers[0];
  const critical = contract.branch === "critical_exposed";
  if (!["critical_exposed", "safe_served", "low_value", "no_demand"].includes(contract.branch) ||
    producers.length !== 1 || !initialProducer || evidence.initialProducerIds.length !== 1 ||
    initialProducer.actorId !== evidence.initialProducerIds[0] || !initialProducer.reachable ||
    !Number.isSafeInteger(initial.usefulDemand) || initial.usefulDemand < 0 || !initial.visibleThreats.length) {
    return ["producer_resilience_initial_setup"];
  }
  const initialCount = initial.products.filter((product) => product.productKey === contract.productKey).length;
  if (exposed(initialProducer, initial) !== (contract.branch !== "safe_served") ||
    (["critical_exposed", "safe_served"].includes(contract.branch) && initial.usefulDemand <= initialCount) ||
    (contract.branch === "low_value" && (initial.usefulDemand === 0 || initial.usefulDemand > initialCount)) ||
    (contract.branch === "no_demand" && initial.usefulDemand !== 0)) return ["producer_resilience_causal_variable"];
  const failures: string[] = [];
  if (snapshots.some((snapshot) => snapshot.usefulDemand !== initial.usefulDemand)) {
    failures.push("producer_resilience_changed_demand");
  }
  const construction = events.filter((event) => event.kind === "construct" && event.productKey === contract.producerObjectName);
  if (!critical) {
    if (construction.length || snapshots.some((snapshot) => snapshot.producers.some((producer) =>
      producer.objectName === contract.producerObjectName && !evidence.initialProducerIds.includes(producer.actorId)))) {
      failures.push("producer_resilience_needless_redundancy");
    }
    return failures;
  }
  const loss = events.find((event) => event.kind === "loss" && event.actorId === initialProducer.actorId);
  if (!loss || loss.tick + contract.stableForTicks > contract.latestTick ||
    snapshots.filter((snapshot) => snapshot.tick >= loss.tick).some((snapshot) =>
      snapshot.producers.some((producer) => producer.actorId === loss.actorId))) {
    failures.push("producer_resilience_scheduled_loss_missing");
    return failures;
  }
  const applied = construction.find((event) => event.createdActorId && !evidence.initialProducerIds.includes(event.createdActorId) &&
    event.tick < loss.tick);
  const ready = applied && snapshots.find((snapshot) => snapshot.tick >= applied.tick && snapshot.tick < loss.tick &&
    snapshot.producers.some((producer) => producer.actorId === applied.createdActorId && producer.ready &&
      producer.reachable && !exposed(producer, snapshot)));
  if (construction.length !== 1 || !ready) failures.push("producer_resilience_safe_capacity_missing");
  if (ready && snapshots.filter((snapshot) => snapshot.tick >= ready.tick).some((snapshot) =>
    !snapshot.producers.some((producer) => producer.actorId === applied?.createdActorId && producer.ready &&
      producer.reachable && !exposed(producer, snapshot)))) failures.push("producer_resilience_safe_capacity_not_retained");
  const afterLoss = events.filter((event) => event.kind === "complete" && event.actorId === applied?.createdActorId &&
    event.productKey === contract.productKey && event.tick >= loss.tick && event.createdActorId &&
    !evidence.initialProductActorIds.includes(event.createdActorId));
  if (!afterLoss.length || !snapshots.some((snapshot) => snapshot.tick >= loss.tick &&
    snapshot.tick <= contract.latestTick - contract.stableForTicks && snapshot.products.some((product) =>
      afterLoss.some((event) => event.tick <= snapshot.tick && event.createdActorId === product.actorId)))) {
    failures.push("producer_resilience_useful_throughput_missing");
  }
  const final = snapshots.at(-1);
  if (!final || !afterLoss.some((event) => final.products.some((product) => product.actorId === event.createdActorId))) {
    failures.push("producer_resilience_product_not_retained");
  }
  return failures;
}
