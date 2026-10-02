import { expect, test } from "@playwright/test";
import { evaluateRuntimeProductionContract } from "./skirmish-ai-runtime-production-contract-evaluation";
import { productionContract, productionEvidence, productionEvent, productionSnapshot, proofProducer }
  from "./skirmish-ai-runtime-production-contract-fixtures";

function resilient() {
  return productionEvidence([0, 100, 200, 400, 600].map((tick) => ({ ...productionSnapshot(tick),
    producers: tick === 0 ? [proofProducer("producer-1", 4)] : tick === 100
      ? [proofProducer("producer-1", 4), proofProducer("safe-new", 12)] : [proofProducer("safe-new", 12)],
    products: tick >= 400 ? [{ actorId: "soldier-new", productKey: "TivaraMacemanMale" }] : []
  })), [
    productionEvent(1, 50, "construct", { productKey: "AnkGuard", createdActorId: "safe-new",
      charged: { wood: 50 }, resourcesAfter: { wood: 50 } }),
    productionEvent(2, 200, "loss", { productKey: "AnkGuard" }),
    productionEvent(3, 400, "complete", { actorId: "safe-new", createdActorId: "soldier-new" })
  ]);
}

test("PRO-06 safe redundancy survives the scheduled critical loss and produces a new retained useful identity", () => {
  expect(evaluateRuntimeProductionContract("PRO-06", productionContract("PRO-06", "critical_exposed"), resilient())).toEqual([]);
});

test("PRO-06 controls decline redundant capacity for safely served, low-value and absent demand", () => {
  for (const branch of ["safe_served", "low_value", "no_demand"] as const) {
    const evidence = productionEvidence([0, 200, 400, 600].map((tick) => ({ ...productionSnapshot(tick),
      usefulDemand: branch === "safe_served" ? 2 : branch === "low_value" ? 1 : 0,
      producers: [proofProducer("producer-1", branch === "safe_served" ? 12 : 4)],
      products: branch === "low_value" ? [{ actorId: "initial-soldier", productKey: "TivaraMacemanMale" }] : []
    })), []);
    const withInitialIds = { ...evidence, initialProductActorIds: branch === "low_value" ? ["initial-soldier"] : [] };
    expect(evaluateRuntimeProductionContract("PRO-06", productionContract("PRO-06", branch), withInitialIds)).toEqual([]);
    expect(evaluateRuntimeProductionContract("PRO-06", productionContract("PRO-06", branch), {
      ...evidence, events: resilient().events.slice(0, 1)
    })).toContain("producer_resilience_needless_redundancy");
  }
});

test("PRO-06 rejects hidden/stale exposure, unsafe or unreachable sites, missing loss and unrelated output", () => {
  const contract = productionContract("PRO-06", "critical_exposed");
  const evidence = resilient();
  expect(evaluateRuntimeProductionContract("PRO-06", contract, { ...evidence,
    snapshots: evidence.snapshots.map((snapshot) => ({ ...snapshot, visibleThreats: [] })) }))
    .toContain("producer_resilience_initial_setup");
  expect(evaluateRuntimeProductionContract("PRO-06", contract, { ...evidence,
    snapshots: evidence.snapshots.map((snapshot) => ({ ...snapshot, visibleThreats: snapshot.visibleThreats.map((threat) =>
      ({ ...threat, observedTick: -1 })) })) })).toContain("producer_resilience_causal_variable");
  for (const unsafe of [true, false]) {
    expect(evaluateRuntimeProductionContract("PRO-06", contract, { ...evidence,
      snapshots: evidence.snapshots.map((snapshot) => ({ ...snapshot, producers: snapshot.producers.map((producer) =>
        producer.actorId === "safe-new" ? { ...producer, position: { x: unsafe ? 5 : 12, y: 5 }, reachable: unsafe } : producer) }))
    })).toContain("producer_resilience_safe_capacity_missing");
  }
  expect(evaluateRuntimeProductionContract("PRO-06", contract, { ...evidence,
    events: evidence.events.filter((event) => event.kind !== "loss") })).toContain("producer_resilience_scheduled_loss_missing");
  expect(evaluateRuntimeProductionContract("PRO-06", contract, { ...evidence,
    events: evidence.events.map((event) => event.kind === "complete" ? { ...event, actorId: "unrelated-producer" } : event) }))
    .toContain("producer_resilience_useful_throughput_missing");
});
