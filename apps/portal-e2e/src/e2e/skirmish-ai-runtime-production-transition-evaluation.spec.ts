import { expect, test } from "@playwright/test";
import { evaluateRuntimeProductionContract } from "./skirmish-ai-runtime-production-contract-evaluation";
import { productionContract, productionEvidence, productionEvent, productionSnapshot, proofProducer }
  from "./skirmish-ai-runtime-production-contract-fixtures";

function future(branch: "future_committed" | "future_abandoned") {
  const transition = { planId: "future-plan", demandId: "future-force", committedTick: 20,
    beginsTick: 200, forceDeadlineTick: 400, desiredForce: 4, status: "committed" as const };
  const snapshots = [0, 20, 100, 200, 400, 600].map((tick) => ({ ...productionSnapshot(tick),
    transition: tick === 0 ? null : transition,
    producers: tick >= 100 && branch === "future_committed"
      ? [proofProducer("producer-1", 4), proofProducer("producer-new", 12)] : [proofProducer("producer-1", 4)],
    products: tick >= 400 && branch === "future_committed" ? Array.from({ length: 4 }, (_, index) =>
      ({ actorId: `soldier-new-${index}`, productKey: "TivaraMacemanMale" })) : [],
    leases: tick === 20 ? [{ claimId: "optional", planId: "future-plan", optional: true, state: "provisional" as const },
      { claimId: "paid-other-plan", planId: "other-plan", optional: true, state: "applied_spending" as const }]
      : tick > 20 ? [{ claimId: "paid-other-plan", planId: "other-plan", optional: true, state: "applied_spending" as const }] : []
  }));
  const evidence = productionEvidence(snapshots, branch === "future_committed" ? [
    productionEvent(1, 50, "construct", { productKey: "AnkGuard", createdActorId: "producer-new",
      charged: { wood: 50 }, resourcesAfter: { wood: 50 } }),
    ...Array.from({ length: 4 }, (_, index) => productionEvent(index + 2, 400, "complete", {
      actorId: index < 2 ? "producer-1" : "producer-new", createdActorId: `soldier-new-${index}` }))
  ] : []);
  return branch === "future_abandoned" ? { ...evidence, snapshots: snapshots.map((snapshot) => ({ ...snapshot,
    transition: snapshot.tick === 0 ? null
      : { ...transition, status: snapshot.tick === 20 ? "committed" as const : "abandoned" as const }
  })) } : evidence;
}

test("PRO-03 separates future prebuild from current queue saturation and keeps the dated force", () => {
  expect(evaluateRuntimeProductionContract("PRO-03", productionContract("PRO-03", "future_committed"), future("future_committed")))
    .toEqual([]);
});

test("PRO-03 abandoned future releases optional unspent claims and retains applied commitments", () => {
  expect(evaluateRuntimeProductionContract("PRO-03", productionContract("PRO-03", "future_abandoned"), future("future_abandoned")))
    .toEqual([]);
});

test("PRO-03 rejects aggregate counts, missing applied effects, late capacity and changing deadlines", () => {
  const contract = productionContract("PRO-03", "future_committed");
  const evidence = future("future_committed");
  expect(evaluateRuntimeProductionContract("PRO-03", undefined, evidence)).toEqual(["production_contract_missing"]);
  expect(evaluateRuntimeProductionContract("PRO-03", contract, undefined)).toEqual(["production_evidence_missing"]);
  expect(evaluateRuntimeProductionContract("PRO-03", contract, { ...evidence, events: [] }))
    .toContain("production_transition_capacity_not_prebuilt");
  expect(evaluateRuntimeProductionContract("PRO-03", contract, { ...evidence, events: evidence.events.map((event) =>
    event.kind === "construct" ? { ...event, tick: 200 } : event) })).toContain("production_transition_capacity_not_prebuilt");
  expect(evaluateRuntimeProductionContract("PRO-03", contract, { ...evidence, snapshots: evidence.snapshots.map((snapshot) =>
    snapshot.tick === 200 && snapshot.transition
      ? { ...snapshot, transition: { ...snapshot.transition, forceDeadlineTick: 500 } } : snapshot) }))
    .toContain("production_transition_changed_commitment");
  expect(evaluateRuntimeProductionContract("PRO-03", contract, { ...evidence, events: evidence.events.slice(0, 1) }))
    .toContain("production_transition_applied_force_missing");
});

test("PRO-03 rejects optional lease retention, paid-claim erasure and spending after abandonment", () => {
  const contract = productionContract("PRO-03", "future_abandoned");
  const evidence = future("future_abandoned");
  expect(evaluateRuntimeProductionContract("PRO-03", contract, { ...evidence,
    snapshots: evidence.snapshots.map((snapshot) => ({ ...snapshot, leases: (evidence.snapshots[1]?.leases ?? []) })) }))
    .toContain("production_transition_unspent_not_released");
  expect(evaluateRuntimeProductionContract("PRO-03", contract, { ...evidence,
    snapshots: evidence.snapshots.map((snapshot) => snapshot.tick === 600 ? { ...snapshot, leases: [] } : snapshot) }))
    .toContain("production_transition_spent_claim_released");
  expect(evaluateRuntimeProductionContract("PRO-03", contract, { ...evidence,
    events: [productionEvent(1, 150, "construct", { productKey: "AnkGuard", createdActorId: "producer-new",
      charged: { wood: 50 }, resourcesAfter: { wood: 50 } })] })).toContain("production_transition_abandoned_spending");
});
