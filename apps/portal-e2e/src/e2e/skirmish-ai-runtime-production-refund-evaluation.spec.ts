import { expect, test } from "@playwright/test";
import { evaluateRuntimeProductionContract } from "./skirmish-ai-runtime-production-contract-evaluation";
import { evaluateRuntimeProductionPayments } from "./skirmish-ai-runtime-production-refund-evaluation";
import { productionContract, productionEvidence, productionEvent, productionSnapshot }
  from "./skirmish-ai-runtime-production-contract-fixtures";

function contention() {
  return productionEvidence([0, 100, 400, 600].map((tick) => ({ ...productionSnapshot(tick),
    completedResearchKeys: tick >= 400 ? ["useful-research"] : [],
    products: tick >= 400 ? [{ actorId: "soldier-new", productKey: "TivaraMacemanMale" }] : [],
    producers: productionSnapshot(tick).producers.map((producer) => ({ ...producer,
      lanes: [{ laneId: "shared-0", capacity: 2, itemIds: tick === 100 ? ["train", "research"] : [] }] }))
  })), [
    productionEvent(1, 50, "enqueue", { itemId: "train", laneId: "shared-0", charged: { wood: 35 },
      resourcesAfter: { wood: 65 } }),
    productionEvent(2, 50, "enqueue", { productKey: "useful-research", itemId: "research", laneId: "shared-0",
      charged: { wood: 20 }, resourcesBefore: { wood: 65 }, resourcesAfter: { wood: 45 } }),
    productionEvent(3, 300, "complete", { itemId: "train", createdActorId: "soldier-new" }),
    productionEvent(4, 300, "complete", { itemId: "research", productKey: "useful-research" })
  ]);
}

function pendingRefund() {
  const snapshots = [0, 100, 200, 400, 600].map((tick) => ({ ...productionSnapshot(tick),
    completedResearchKeys: tick >= 400 ? ["useful-research"] : [],
    producers: productionSnapshot(tick).producers.map((producer) => ({ ...producer,
      lanes: [{ laneId: "shared-0", capacity: 2, itemIds: tick < 200 ? ["paid-old"] : tick === 200 ? ["new-research"] : [] }] }))
  }));
  return { ...productionEvidence(snapshots, [
    productionEvent(1, 0, "enqueue", { itemId: "paid-old", laneId: "shared-0", charged: { wood: 35 },
      resourcesBefore: { wood: 35 }, resourcesAfter: { wood: 0 } }),
    productionEvent(2, 100, "cancel_requested", { itemId: "paid-old", resourcesBefore: { wood: 0 }, resourcesAfter: { wood: 0 } }),
    productionEvent(3, 150, "enqueue_rejected", { productKey: "useful-research", resourcesBefore: { wood: 0 },
      resourcesAfter: { wood: 0 } }),
    productionEvent(4, 200, "cancel", { itemId: "paid-old", resourcesBefore: { wood: 0 }, resourcesAfter: { wood: 0 } }),
    productionEvent(5, 200, "refund", { refundForItemId: "paid-old", refundAmounts: { wood: 35 },
      resourcesBefore: { wood: 0 }, resourcesAfter: { wood: 35 } }),
    productionEvent(6, 200, "enqueue", { productKey: "useful-research", itemId: "new-research", laneId: "shared-0",
      resourcesBefore: { wood: 35 }, resourcesAfter: { wood: 15 }, charged: { wood: 20 } }),
    productionEvent(7, 350, "complete", { productKey: "useful-research", itemId: "new-research" })
  ]), initialPaidItemIds: ["paid-old"] };
}

test("PRO-07 useful train and research occupy one real shared lane and independently complete", () => {
  expect(evaluateRuntimeProductionContract("PRO-07", productionContract("PRO-07", "shared_contention"), contention())).toEqual([]);
});

test("PRO-07 pending refund cannot fund an order before application, including same-tick application ordering", () => {
  expect(evaluateRuntimeProductionContract("PRO-07", productionContract("PRO-07", "cancel_pending_refund"), pendingRefund()))
    .toEqual([]);
});

test("PRO-07 rejects separate lanes masquerading as contention, overbooking and unpriced free orders", () => {
  const contract = productionContract("PRO-07", "shared_contention");
  const evidence = contention();
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence, events: evidence.events.map((event) =>
    event.itemId === "research" ? { ...event, laneId: "separate-research" } : event) }))
    .toContain("production_shared_contention_missing");
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence, snapshots: evidence.snapshots.map((snapshot) =>
    ({ ...snapshot, producers: snapshot.producers.map((producer) => ({ ...producer,
      lanes: producer.lanes.map((lane) => ({ ...lane, capacity: 1 })) })) })) })).toContain("production_shared_lane_overbooked");
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence, events: evidence.events.map((event) =>
    event.kind === "enqueue" ? { ...event, charged: { wood: 0 }, resourcesAfter: event.resourcesBefore } : event) }))
    .toContain("production_catalog_price_mismatch");
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence, snapshots: evidence.snapshots.map((snapshot) =>
    ({ ...snapshot, completedResearchKeys: [] })) })).toContain("production_useful_train_research_completion_missing");
});

test("PRO-07 rejects missing pending boundary, spending imaginary refunds and cancellation/requeue cycles", () => {
  const contract = productionContract("PRO-07", "cancel_pending_refund");
  const evidence = pendingRefund();
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence,
    events: evidence.events.filter((event) => event.kind !== "refund") })).toContain("production_pending_refund_boundary_missing");
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence, events: evidence.events.map((event) =>
    event.kind === "enqueue_rejected" ? { ...event, kind: "enqueue", itemId: "bad", laneId: "shared-0",
      charged: { wood: 20 }, resourcesAfter: { wood: -20 } } : event) }))
    .toContain("production_payment_numeric_evidence");
  expect(evaluateRuntimeProductionContract("PRO-07", contract, { ...evidence, events: [...evidence.events,
    productionEvent(8, 500, "enqueue", { itemId: "requeued", laneId: "shared-0", charged: { wood: 35 },
      resourcesAfter: { wood: 65 } })] })).toContain("production_cancel_requeue_cycle");
});

test("PRO-07 pay-over-time reserves catalog obligations and cannot spend money due to another commitment", () => {
  const evidence = productionEvidence([], [productionEvent(1, 0, "enqueue", { itemId: "over-time", laneId: "shared-0",
    obligationsAfter: { wood: 35 } }), productionEvent(2, 10, "pay", { itemId: "over-time", charged: { wood: 5 },
    resourcesBefore: { wood: 40 }, resourcesAfter: { wood: 35 }, obligationsDue: { wood: 35 },
    obligationsAfter: { wood: 30 } })]);
  const overTime = { ...evidence, catalog: evidence.catalog.map((entry) => entry.kind === "production"
    ? { ...entry, payment: "over_time" as const } : entry) };
  expect(evaluateRuntimeProductionPayments(overTime)).toEqual([]);
  expect(evaluateRuntimeProductionPayments({ ...overTime, events: overTime.events.map((event) => event.kind === "enqueue"
    ? { ...event, obligationsAfter: {} } : event) })).toContain("production_unfunded_remaining_obligation");
  expect(evaluateRuntimeProductionPayments({ ...overTime, events: overTime.events.map((event) => event.kind === "pay"
    ? { ...event, obligationsDue: { wood: 75 } } : event) })).toContain("production_spent_unapplied_money");
});
