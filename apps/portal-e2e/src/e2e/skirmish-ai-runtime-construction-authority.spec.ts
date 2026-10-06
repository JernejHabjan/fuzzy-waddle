import { expect, test } from "@playwright/test";
import { ConstructionStateEnum, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeConstructionV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-construction-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionSpatialFixture } from "./skirmish-ai-runtime-production-spatial-fixture";
import { normalizeRuntimeConstructionAuthority } from "./skirmish-ai-runtime-construction-authority";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

function fixture() {
  const f = productionSpatialFixture();
  const before: Record<ResourceType, number> = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const resource = { kind: "resource", site: f.placement.site, state: ConstructionStateEnum.NotStarted,
    remainingWorkMs: 0, snapshotRestoreInProgress: false, sceneActive: true, clockTick: 20,
    operation: "cancel_refund", status: "returned", ownerArgument: 1, configuredCostType: 1, requiredWorkMs: 150,
    configuredCost: { food: 11 }, requested: { food: 5 }, refundFactor: 0.5, before, after: { ...before, food: 105 },
    callbackAmounts: { food: 5 }, callbackCount: 1, nestedEmission: false, balanceMatches: true } satisfies AiRuntimeConstructionV1;
  const fact = (construction: AiRuntimeConstructionV1, sequence = 5): AiRuntimeProductionFactV1 =>
    ({ kind: "construction_authority", sequence, tick: 20, playerNumber: 1, construction });
  return { ...f, resource, fact };
}

test("construction retains native free pre-start/repeated refunds and changed current definitions as diagnostic attempts", () => {
  const f = fixture(); const second = { ...f.resource, configuredCost: { food: 20 }, requested: { food: 10 },
    callbackAmounts: { food: 10 }, before: { ...f.resource.before, food: 105 }, after: { ...f.resource.after, food: 115 } };
  const capture = { ...f.capture, facts: [...f.capture.facts, f.fact(f.resource), f.fact(second, 6)] };
  const result = normalizeRuntimeConstructionAuthority(capture);
  expect(result.failures).toEqual([]); expect(result.records).toHaveLength(2);
  expect(result.gaps).toContain("production_construction_payment_history_missing");
  expect(result.gaps).toContain("production_construction_ai_lifecycle_identity_missing");
  expect(result.gaps).toContain("production_construction_global_resource_interval_unverified");
  expect(result.gaps).toContain("production_construction_definition_history_missing");
  expect(normalizeRuntimeProductionCausality(capture).constructionAuthority).toEqual(result.records);
});

test("configured immediate construction can legitimately retain the native skipped charge predicate", () => {
  const f = fixture(); const skipped = { ...f.resource, operation: "start_charge" as const, status: "skipped" as const,
    configuredCostType: 0, ownerArgument: null, requested: null, refundFactor: null, before: null, after: null,
    callbackAmounts: null, callbackCount: 0, balanceMatches: false };
  const result = normalizeRuntimeConstructionAuthority({ ...f.capture, facts: [f.fact(skipped, 1)] });
  expect(result.failures).toEqual([]);
  expect(result.gaps).toContain("production_construction_configured_immediate_native_charge_skipped");
  expect(result.records[0].construction).toMatchObject({ status: "skipped", requested: null });
});

test("a zero-work native charge and denial stay separate from configured payment mode", () => {
  const f = fixture(); const charge = { ...f.resource, operation: "start_charge" as const, requiredWorkMs: 0,
    requested: { food: 11 }, callbackAmounts: { food: 11 }, after: { ...f.resource.after, food: 89 }, refundFactor: null };
  expect(normalizeRuntimeConstructionAuthority({ ...f.capture, facts: [f.fact(charge, 1)] }).failures).toEqual([]);
  const denied = { ...charge, status: "denied" as const, callbackCount: 0, callbackAmounts: null,
    after: charge.before, balanceMatches: false };
  const result = normalizeRuntimeConstructionAuthority({ ...f.capture, facts: [f.fact(denied, 1)] });
  expect(result.failures).toEqual([]); expect(result.records[0].construction).toMatchObject({ status: "denied" });
});

test("restore suppression, missing owner and nested/thrown intervals retain gaps without fabricated applied money", () => {
  const f = fixture();
  const variants: AiRuntimeConstructionV1[] = [
    { ...f.resource, snapshotRestoreInProgress: true, callbackAmounts: null, callbackCount: 0,
      after: f.resource.before, balanceMatches: false },
    { ...f.resource, ownerArgument: null, before: null, after: null, callbackAmounts: null, callbackCount: 0, balanceMatches: false },
    { ...f.resource, nestedEmission: true, balanceMatches: false },
    { ...f.resource, status: "threw", callbackCount: 0, callbackAmounts: null, after: f.resource.before, balanceMatches: false }
  ];
  for (const value of variants) {
    const result = normalizeRuntimeConstructionAuthority({ ...f.capture, facts: [f.fact(value, 1)] });
    expect(result.failures).toEqual([]); expect(result.records).toHaveLength(1);
    expect(result.gaps).toContain("production_construction_resource_application_unproven");
  }
});

test("real state boundaries retain restore/teardown while contradictory start/finish state fails closed", () => {
  const f = fixture(); const lifecycle = { site: f.resource.site, kind: "lifecycle", state: ConstructionStateEnum.Constructing,
    remainingWorkMs: 75, snapshotRestoreInProgress: true, sceneActive: true, clockTick: 20, transition: "restored" }
    satisfies AiRuntimeConstructionV1;
  expect(normalizeRuntimeConstructionAuthority({ ...f.capture, facts: [f.fact(lifecycle, 1)] }).failures).toEqual([]);
  expect(normalizeRuntimeConstructionAuthority({ ...f.capture, facts: [f.fact({ ...lifecycle, transition: "teardown" }, 1)] })
    .records).toHaveLength(1);
  for (const transition of ["started", "finished"] as const) {
    const result = normalizeRuntimeConstructionAuthority({ ...f.capture,
      facts: [f.fact({ ...lifecycle, state: ConstructionStateEnum.NotStarted, transition }, 1)] });
    expect(result.failures).toContain("production_construction_lifecycle_invalid"); expect(result.records).toEqual([]);
  }
});

test("contradictory money, owner, callback, boundary and native predicate suppress every normalized authority group", () => {
  const f = fixture();
  const defects: AiRuntimeConstructionV1[] = [
    { ...f.resource, requested: { food: 6 } }, { ...f.resource, after: { ...f.resource.after, food: 106 } },
    { ...f.resource, ownerArgument: 2 }, { ...f.resource, callbackCount: 0 },
    { ...f.resource, refundFactor: Number.NaN }, { ...f.resource, configuredCost: { food: -1 } },
    { ...f.resource, requiredWorkMs: Number.NaN }, { ...f.resource, clockTick: 21 },
    { ...f.resource, operation: "start_charge", refundFactor: null },
    { ...f.resource, state: ConstructionStateEnum.Finished }
  ];
  for (const defect of defects) {
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts: [...f.capture.facts, f.fact(defect)] });
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.constructionAuthority).toEqual([]); expect(result.constructionCatalog).toEqual([]);
    expect(result.spatialAuthority).toEqual({ placements: [], spawns: [], paths: [] });
    expect(result.worldSnapshots).toEqual([]); expect(result.payments).toEqual([]); expect(result.effectRetention).toEqual([]);
  }
});

test("legacy omission stays missing and 257 attempts drop the entire group while still inspecting contradictions", () => {
  const f = fixture();
  expect(normalizeRuntimeConstructionAuthority(f.capture).gaps).toContain("production_construction_authority_missing");
  const facts = Array.from({ length: 257 }, (_, index) => f.fact(f.resource, index + 1));
  const result = normalizeRuntimeConstructionAuthority({ ...f.capture, facts });
  expect(result.records).toEqual([]); expect(result.gaps).toContain("production_construction_authority_overflow");
  const invalid = [...facts.slice(0, 256), f.fact({ ...f.resource, refundFactor: -1 }, 257)];
  expect(normalizeRuntimeConstructionAuthority({ ...f.capture, facts: invalid }).failures)
    .toContain("production_construction_resource_invalid");
});
