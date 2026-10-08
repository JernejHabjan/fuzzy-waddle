import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { resourceCreditFixture } from "./skirmish-ai-runtime-resource-credit-fixture";
import { normalizeRuntimeResourceCredits } from "./skirmish-ai-runtime-resource-credit-normalization";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

test("a whole credited pile keeps both earlier gathering tasks and the actual beneficiary", () => {
  const result = normalizeRuntimeProductionCausality(resourceCreditFixture().capture);
  expect(result.failures).toEqual([]);
  expect(result.resourceCredits[0]).toMatchObject({ appliedAmount: 3, beneficiary: 2, cargoAttributed: true,
    delivery: { attemptId: 3, callerAttributed: true }, contributions: [
      { amount: 1, gathering: { attemptId: 1, serviceCommand: { command: { execution: { commandId: "service" } } } } },
      { amount: 2, gathering: { attemptId: 2, selectedDemand: { demand: { demandId: "demand:service" } } } }
    ] });
  expect(result.resourceCredits[0].gaps).toContain("production_resource_credit_cross_owner");
  expect(result.gaps).toContain("production_service_useful_fulfillment_missing");
  expect(result.gaps).toContain("production_service_continuous_stability_missing");
});

test("immediate source-owner credit remains separate from gathering return and local rally purchase purpose", () => {
  const f = resourceCreditFixture(0, true, true), result = normalizeRuntimeResourceCredits(f.capture);
  expect(result.failures).toEqual([]);
  expect(result.credits[0]).toMatchObject({ appliedAmount: 3, cargoAttributed: true, delivery: { attemptId: 1 },
    contributions: [{ amount: 3, gathering: { serviceCommand: null, selectedDemand: null } }] });
});

test("old cargo cannot assign an entire pile to the latest gathering or delivery task", () => {
  const result = normalizeRuntimeResourceCredits(resourceCreditFixture(4).capture);
  expect(result.failures).toEqual([]); expect(result.credits[0]).toMatchObject({ appliedAmount: 7,
    cargoAttributed: false, contributions: [] });
});

for (const missing of ["entry", "addition_owner", "offer", "consumption", "admission", "clock",
  "mixed_type", "target_scene"] as const) {
  test(`missing ${missing} preserves scoped credit but leaves whole-pile provenance unavailable`, () => {
    const f = resourceCreditFixture();
    const capture = f.rewrite((fact): AiRuntimeProductionFactV1[] => {
      if (missing === "admission" && fact.kind === "spatial_authority" && fact.spatial.kind === "route_order") return [];
      if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "resource_service") return [fact];
      const value = fact.spatial;
      if (missing === "entry" && value.phase === "cargo_started") return [];
      if (missing === "offer" && value.phase === "cargo_offered" || missing === "consumption" &&
        value.phase === "cargo_changed" && value.change.reason === "removed") return [];
      if (value.phase !== "cargo_changed" || value.change.reason !== "added" || value.attemptId !== 1) return [fact];
      return [{ ...fact, spatial: { ...value, attemptId: missing === "addition_owner" ? null : value.attemptId,
        clockTick: missing === "clock" ? null : value.clockTick,
        after: missing === "mixed_type" ? { ...value.after, resourceType: null } : value.after,
        targetInCaptureScene: missing === "target_scene" ? false : value.targetInCaptureScene } }];
    });
    const result = normalizeRuntimeResourceCredits(capture);
    expect(result.failures).toEqual([]); expect(result.credits[0]).toMatchObject({ appliedAmount: 3, cargoAttributed: false,
      contributions: [] });
  });
}

for (const unavailable of ["campaign", "callback", "interference", "restore", "balance", "threw"] as const) {
  test(`${unavailable} cannot promote a full native return to applied income`, () => {
    const f = resourceCreditFixture();
    const capture = f.rewrite((fact): AiRuntimeProductionFactV1[] => {
      if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "resource_service" || fact.spatial.phase !== "resource_credit") {
        return [fact];
      }
      const value = fact.spatial;
      return [{ ...fact, spatial: { ...value, balanceMatches: false,
        status: unavailable === "campaign" ? "campaign_suppressed" : unavailable === "threw" ? "threw" : "returned",
        callbackCount: unavailable === "callback" || unavailable === "campaign" ? 0 : 1,
        callbackAmounts: unavailable === "campaign" || unavailable === "callback" ? null : value.callbackAmounts,
        interference: unavailable === "interference", emissionRestoreInProgress: unavailable === "restore",
        after: unavailable === "balance" || unavailable === "campaign" ? value.before : value.after } }];
    });
    const result = normalizeRuntimeResourceCredits(capture);
    expect(result.failures).toEqual([]); expect(result.credits[0].appliedAmount).toBeNull();
  });
}

test("cargo-only restore fences a pending pile even without a board restore, and revival is contradictory", () => {
  const f = resourceCreditFixture();
  const capture = f.rewrite((fact): AiRuntimeProductionFactV1[] => {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "resource_service") return [fact];
    if (fact.spatial.phase === "resource_credit") return [f.fact({ ...f.common, kind: "resource_service", phase: "cargo_changed",
      cargoId: 1, attemptId: null, transferId: null, target: null, targetInCaptureScene: null, change: { reason: "restore" },
      before: f.offer.cargo, after: f.offer.cargo }), { ...fact, spatial: { ...fact.spatial, lifetimeValid: false } }];
    return fact.spatial.phase === "cargo_changed" && fact.spatial.change.reason === "removed" ?
      [{ ...fact, spatial: { ...fact.spatial, lifetimeValid: false } }] : [fact];
  });
  const result = normalizeRuntimeResourceCredits(capture);
  expect(result.failures).toEqual([]); expect(result.credits[0]).toMatchObject({ appliedAmount: 3, cargoAttributed: false });
  const revived = capture.facts.map((fact): AiRuntimeProductionFactV1 => fact.kind === "spatial_authority" &&
    fact.spatial.kind === "resource_service" && fact.spatial.phase === "resource_credit" ?
      { ...fact, spatial: { ...fact.spatial, lifetimeValid: true } } : fact);
  expect(normalizeRuntimeResourceCredits({ ...capture, facts: revived }).failures)
    .toContain("production_resource_cargo_lifetime_revived");
});

test("a partial pile consumption has no invented FIFO attribution", () => {
  const f = resourceCreditFixture();
  const capture = f.rewrite((fact): AiRuntimeProductionFactV1[] => fact.kind === "spatial_authority" &&
    fact.spatial.kind === "resource_service" && fact.spatial.phase === "cargo_changed" && fact.spatial.change.reason === "removed" ?
    [{ ...fact, spatial: { ...fact.spatial, after: { amount: 1, resourceType: f.offer.cargo.resourceType } } }] : [fact]);
  const result = normalizeRuntimeResourceCredits(capture);
  expect(result.failures).toEqual([]); expect(result.credits[0]).toMatchObject({ appliedAmount: 3, cargoAttributed: false });
});

test("a target unregister/reuse fence prevents cargo attribution while retaining observed balance application", () => {
  const f = resourceCreditFixture();
  const capture = f.rewrite((fact): AiRuntimeProductionFactV1[] => fact.kind === "spatial_authority" &&
    fact.spatial.kind === "resource_service" && fact.spatial.phase === "resource_credit" ?
    [{ sequence: 0, tick: 10, playerNumber: 1, kind: "actor_unregistered", actorId: f.producer.actorId ?? "",
      objectName: f.producer.objectName }, fact] : [fact]);
  const result = normalizeRuntimeResourceCredits(capture);
  expect(result.failures).toEqual([]); expect(result.credits[0]).toMatchObject({ appliedAmount: 3, cargoAttributed: false });
});

test("zero credit remains a zero observation and supplies no positive cargo contribution", () => {
  const f = resourceCreditFixture();
  const capture = f.rewrite((fact): AiRuntimeProductionFactV1[] => {
    if (fact.kind === "spatial_authority" && fact.spatial.kind === "service_attempt" && fact.spatial.attemptId === 3 &&
      fact.spatial.phase === "resolved") return [{ ...fact, spatial: { ...fact.spatial, amount: 0 } }];
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "resource_service") return [fact];
    const value = fact.spatial;
    if (value.phase === "cargo_offered") return [{ ...fact,
      spatial: { ...value, cargo: { amount: 0, resourceType: value.cargo.resourceType } } }];
    if (value.phase === "resource_credit") return [{ ...fact, spatial: { ...value, amount: 0,
      after: value.before, callbackAmounts: { wood: 0 } } }];
    if (value.phase !== "cargo_changed" || value.change.reason !== "removed") return [fact];
    return [{ ...fact, spatial: { ...value, before: { amount: 0, resourceType: value.before.resourceType },
      change: { ...value.change, delta: 0 } } }];
  });
  const result = normalizeRuntimeResourceCredits(capture);
  expect(result.failures).toEqual([]);
  expect(result.credits[0]).toMatchObject({ appliedAmount: 0, cargoAttributed: false, contributions: [] });
});

for (const invalid of ["duplicate", "amount", "beneficiary", "cargo_identity", "transfer_identity", "claim", "gather_result"] as const) {
  test(`contradictory ${invalid} suppresses resource and existing normalized groups`, () => {
    const f = resourceCreditFixture();
    const capture = f.rewrite((fact): AiRuntimeProductionFactV1[] => {
      if (invalid === "gather_result" && fact.kind === "spatial_authority" && fact.spatial.kind === "service_attempt" &&
        fact.spatial.attemptId === 1 && fact.spatial.phase === "resolved") return [{ ...fact, spatial: { ...fact.spatial, amount: 9 } }];
      if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "resource_service" || fact.spatial.phase !== "resource_credit") {
        return [fact];
      }
      if (invalid === "duplicate") return [fact, fact];
      const value = fact.spatial;
      return [{ ...fact, spatial: { ...value, amount: invalid === "amount" ? -1 : value.amount,
        beneficiary: invalid === "beneficiary" ? 3 : value.beneficiary,
        source: invalid === "cargo_identity" ? { ...value.source, actorId: "other_worker" } : value.source,
        attemptId: invalid === "transfer_identity" ? 1 : value.attemptId,
        balanceMatches: invalid === "claim" ? false : value.balanceMatches } }];
    });
    const result = normalizeRuntimeProductionCausality(capture);
    expect(result.failures.length).toBeGreaterThan(0); expect(result.resourceCredits).toEqual([]);
    expect(result.serviceAttempts).toEqual([]); expect(result.producerRoutes.paths).toEqual([]);
  });
}

test("overflow drops the resource group but still rejects its contradictory supplied tail", () => {
  const f = resourceCreditFixture();
  const extra = Array.from({ length: 256 }, (_, index) => f.fact({ ...f.common, kind: "resource_service", phase: "cargo_changed",
    cargoId: index + 2, attemptId: null, transferId: null, target: null, targetInCaptureScene: null,
    change: { reason: "reset" }, before: { amount: 0, resourceType: null }, after: { amount: 0, resourceType: null } }));
  const facts = [...f.capture.facts, ...extra].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeResourceCredits({ ...f.capture, facts });
  expect(result.failures).toEqual([]); expect(result.credits).toEqual([]);
  expect(result.gaps).toContain("production_resource_service_group_overflow");
  facts.push({ ...f.fact({ ...f.credit, callbackCount: 2 }), sequence: facts.length + 1 });
  expect(normalizeRuntimeResourceCredits({ ...f.capture, facts }).failures).toContain("production_resource_credit_payload_invalid");
  expect(normalizeRuntimeResourceCredits({ ...f.capture, droppedFactCount: 1 }).credits).toEqual([]);
});
