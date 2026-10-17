import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeProductionSpatialV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-spatial-v1";
import { routeOrderFixture } from "./skirmish-ai-runtime-route-order-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { normalizeRuntimeServiceAttempts } from "./skirmish-ai-runtime-service-attempt-normalization";

function fixture(rally = false) {
  const f = routeOrderFixture(rally);
  const started = { kind: "service_attempt", attemptId: 1, operation: "drop_off", phase: "started", amount: null,
    source: f.product, target: f.producer, sourceInCaptureScene: true, targetInCaptureScene: true,
    order: f.currentOrder, lifetimeValid: true, clockTick: 10, sceneActive: true, snapshotRestoreInProgress: false, gaps: []
  } satisfies AiRuntimeProductionSpatialV1;
  const resolved = { ...started, phase: "resolved", amount: 3 } satisfies AiRuntimeProductionSpatialV1;
  const facts = [...f.capture.facts, f.fact(started), f.fact(resolved)].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  return { ...f, started, resolved, capture: { ...f.capture, facts } };
}

test("a native service attempt owns its earlier task/demand without claiming income", () => {
  const result = normalizeRuntimeProductionCausality(fixture().capture);
  expect(result.failures).toEqual([]);
  expect(result.serviceAttempts[0]).toMatchObject({ callerAttributed: true, nativeResultAmount: 3,
    serviceCommand: { command: { execution: { commandId: "service" } } },
    selectedDemand: { demand: { demandId: "demand:service" } } });
  for (const gap of ["production_service_actual_credit_missing", "production_service_cargo_history_missing",
    "production_service_resource_type_and_beneficiary_missing", "production_service_useful_fulfillment_missing",
    "production_service_continuous_stability_missing"]) expect(result.gaps).toContain(gap);
});

test("local rally ownership cannot borrow a product's purchase demand for useful service", () => {
  const result = normalizeRuntimeProductionCausality(fixture(true).capture);
  expect(result.failures).toEqual([]);
  expect(result.serviceAttempts[0]).toMatchObject({ callerAttributed: true, serviceCommand: null, selectedDemand: null });
});

test("a replacement order cannot supply purpose to the retained original service attempt", () => {
  const f = fixture();
  const replacement = f.fact({ ...f.requested, kind: "route_order", source: f.product,
    order: { ...f.currentOrder, orderId: 2, commandContext: null, originOutputId: null } });
  const facts = f.capture.facts.flatMap((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "service_attempt" &&
    fact.spatial.phase === "resolved" ? [replacement, fact] : [fact]).map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.serviceAttempts[0]).toMatchObject({ callerAttributed: true, admission: { spatial: { order: { orderId: 1 } } },
    serviceCommand: { command: { execution: { commandId: "service" } } } });
});

for (const phase of ["resolved", "rejected", "threw"] as const) {
  test(`native ${phase} preserves caller ownership and separates zero or failed results`, () => {
    const f = fixture(), facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "service_attempt" && fact.spatial.phase !== "started" ?
        { ...fact, spatial: { ...fact.spatial, phase, amount: phase === "resolved" ? 0 : null } } : fact);
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    expect(result.serviceAttempts[0]).toMatchObject({ callerAttributed: true, nativeResultAmount: phase === "resolved" ? 0 : null });
    expect(result.gaps).toContain("production_service_actual_credit_missing");
  });
}

for (const missing of ["order", "admission", "terminal", "clock", "target_scene", "pre_admission"] as const) {
  test(`missing ${missing} cannot receive native attempt ownership`, () => {
    const f = fixture(), facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (missing === "admission" && fact.kind === "spatial_authority" && fact.spatial.kind === "route_order") return [];
      if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "service_attempt") return [fact];
      const value = fact.spatial;
      if (missing === "terminal" && value.phase !== "started") return [];
      return [{ ...fact, spatial: { ...value, order: missing === "order" ? undefined :
        missing === "pre_admission" ? { ...f.currentOrder, admissionObserved: false } : value.order,
        clockTick: missing === "clock" ? null : value.clockTick,
        targetInCaptureScene: missing === "target_scene" ? false : value.targetInCaptureScene } }];
    });
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]); expect(result.serviceAttempts[0]?.callerAttributed).toBe(false);
    expect(result.serviceAttempts[0]?.serviceCommand).toBeNull();
  });
}

test("restore/reuse fences the original attempt and a true lifetime revival is contradictory", () => {
  const f = fixture();
  const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "service_attempt" || fact.spatial.phase === "started") return [fact];
    return [f.fact({ ...f.requested, kind: "route_order_restore", source: f.product, reason: "restore_attempt" }),
      { ...fact, spatial: { ...fact.spatial, lifetimeValid: false } }];
  }).map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]); expect(result.serviceAttempts[0]).toMatchObject({ callerAttributed: false, admission: null });
  const revived = facts.map((fact): AiRuntimeProductionFactV1 => fact.kind === "spatial_authority" &&
    fact.spatial.kind === "service_attempt" ? { ...fact, spatial: { ...fact.spatial, lifetimeValid: true } } : fact);
  expect(normalizeRuntimeServiceAttempts({ ...f.capture, facts: revived }).failures)
    .toContain("production_service_attempt_lifetime_revived");
});

test("unregistered/reused target prevents ownership without inventing source lifetime loss", () => {
  const f = fixture(), fence: AiRuntimeProductionFactV1 = { sequence: 0, tick: 10, playerNumber: 1,
    kind: "actor_unregistered", actorId: f.producer.actorId ?? "", objectName: f.producer.objectName };
  const facts = f.capture.facts.flatMap((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "service_attempt" &&
    fact.spatial.phase === "resolved" ? [fence, fact] : [fact]).map((fact, index) => ({ ...fact, sequence: index + 1 }));
  expect(normalizeRuntimeServiceAttempts({ ...f.capture, facts }).attempts[0]?.callerAttributed).toBe(false);
});

test("a fresh attempt identity cannot revive an old admitted order after controller replacement", () => {
  const f = fixture();
  const tail = [f.fact({ ...f.requested, kind: "route_order_restore", source: f.product, reason: "controller_replaced" }),
    f.fact({ ...f.started, attemptId: 2 }), f.fact({ ...f.resolved, attemptId: 2 })];
  const facts = [...f.capture.facts, ...tail].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  expect(normalizeRuntimeServiceAttempts({ ...f.capture, facts }).failures)
    .toContain("production_service_attempt_lifetime_revived");
});

for (const invalid of ["orphan", "duplicate", "amount", "target", "stamp", "phase", "operation"] as const) {
  test(`contradictory ${invalid} suppresses normalized groups`, () => {
    const f = fixture();
    const terminal = { ...f.resolved, attemptId: invalid === "orphan" ? 2 : 1,
      phase: invalid === "phase" ? "started" : "resolved", amount: invalid === "amount" ? -1 : 3,
      target: invalid === "target" ? { ...f.producer, actorId: "other_target" } : f.producer,
      operation: invalid === "operation" ? "gather" : "drop_off",
      order: invalid === "stamp" ? { ...f.currentOrder, commandContext: null } : f.currentOrder
    } satisfies AiRuntimeProductionSpatialV1;
    const existing = invalid === "duplicate" ? f.capture.facts : f.capture.facts.slice(0, -1);
    const facts = [...existing, f.fact(terminal)].map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures.length).toBeGreaterThan(0); expect(result.serviceAttempts).toEqual([]);
    expect(result.producerRoutes.paths).toEqual([]); expect(result.movements).toEqual([]);
  });
}

test("attempt overflow drops the group but still inspects the contradictory tail", () => {
  const f = fixture(), tail = Array.from({ length: 256 }, (_, index) => f.fact({ ...f.started, attemptId: index + 2 }));
  const facts = [...f.capture.facts, ...tail].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeServiceAttempts({ ...f.capture, facts });
  expect(result.failures).toEqual([]); expect(result.attempts).toEqual([]);
  expect(result.gaps).toContain("production_service_attempt_group_overflow");
  facts.push({ ...f.fact({ ...f.resolved, attemptId: 257, order: { ...f.currentOrder, commandContext: null } }),
    sequence: facts.length + 1 });
  expect(normalizeRuntimeServiceAttempts({ ...f.capture, facts }).failures).toContain("production_route_order_identity_conflict");
});
