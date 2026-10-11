import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeProductionSpatialV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-spatial-v1";
import { routeOrderFixture } from "./skirmish-ai-runtime-route-order-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { normalizeRuntimeMovement } from "./skirmish-ai-runtime-movement-normalization";

function fixture(fallback = false, stopped = false) {
  const f = routeOrderFixture(), destination = { x: 8, y: 9 }, selected = fallback ? { x: 7, y: 9 } : destination;
  const value = { kind: "movement", executionId: 1, mode: "path", source: f.product, sourceInCaptureScene: true,
    caller: { invocationId: 1, caller: "location_movement", stage: "initial", order: f.currentOrder, lifetimeValid: true },
    originalDestination: destination, selectedDestination: null, fallback: false, actualTile: { x: 3, y: 4 },
    clockTick: 10, sceneActive: true, snapshotRestoreInProgress: false, gaps: [], phase: "started"
  } satisfies AiRuntimeProductionSpatialV1;
  const boundaries: AiRuntimeProductionSpatialV1[] = [value,
    { ...value, phase: "destination", selectedDestination: destination },
    ...(fallback ? [{ ...value, phase: "destination" as const, selectedDestination: selected, fallback: true }] : []),
    { ...value, phase: stopped ? "stopped" : "arrived", selectedDestination: selected, fallback,
      actualTile: stopped ? { x: 4, y: 4 } : selected },
    { ...value, phase: "returned_true", selectedDestination: selected, fallback, actualTile: selected }];
  const facts = [...f.capture.facts, ...boundaries.map(f.fact)].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  return { ...f, value, capture: { ...f.capture, facts } };
}

test("physical original endpoint arrival reaches the report separately from useful service", () => {
  const f = fixture(), result = normalizeRuntimeProductionCausality(f.capture);
  expect(result.failures).toEqual([]);
  expect(result.movements[0]).toMatchObject({ callerAttributed: true, arrival: "original_destination", returned: "true" });
  expect(result.gaps).toContain("production_movement_service_effect_missing");
  expect(result.gaps).toContain("production_movement_continuous_stability_missing");
});

test("a fallback arrival cannot claim the original endpoint", () => {
  const result = normalizeRuntimeProductionCausality(fixture(true).capture);
  expect(result.failures).toEqual([]);
  expect(result.movements[0]).toMatchObject({ callerAttributed: true, arrival: "fallback_destination", returned: "true" });
  expect(result.gaps).toContain("production_movement_original_destination_not_reached");
});

test("native cancellation can return true while remaining stopped", () => {
  const result = normalizeRuntimeProductionCausality(fixture(false, true).capture);
  expect(result.failures).toEqual([]);
  expect(result.movements[0]).toMatchObject({ arrival: "stopped", returned: "true" });
});

for (const missing of ["caller", "admission", "terminal", "clock", "actual_tile", "return"] as const) {
  test(`missing ${missing} cannot be backfilled from route success`, () => {
    const f = fixture();
    const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (missing === "admission" && fact.kind === "spatial_authority" && fact.spatial.kind === "route_order") return [];
      if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "movement") return [fact];
      const value = fact.spatial;
      if (missing === "terminal" && value.phase === "arrived" || missing === "return" && value.phase === "returned_true") return [];
      return [{ ...fact, spatial: { ...value, caller: missing === "caller" ? undefined : value.caller,
        clockTick: missing === "clock" ? null : value.clockTick,
        actualTile: missing === "actual_tile" ? null : value.actualTile } }];
    });
    const result = normalizeRuntimeMovement({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    if (["caller", "admission", "clock"].includes(missing)) expect(result.movements[0]?.callerAttributed).toBe(false);
    if (["caller", "terminal", "clock", "actual_tile"].includes(missing)) expect(result.movements[0]?.arrival).toBe("unavailable");
    if (missing === "return") expect(result.movements[0]?.returned).toBeNull();
  });
}

test("callback failure keeps the earlier physical arrival separate from the false return", () => {
  const f = fixture(), facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 =>
    fact.kind === "spatial_authority" && fact.spatial.kind === "movement" && fact.spatial.phase === "returned_true" ?
      { ...fact, spatial: { ...fact.spatial, phase: "returned_false" } } : fact);
  expect(normalizeRuntimeMovement({ ...f.capture, facts }).movements[0]).toMatchObject({
    arrival: "original_destination", returned: "false" });
});

test("restore fences movement ownership and prevents physical arrival credit across the lifetime", () => {
  const f = fixture();
  const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "movement") return [fact];
    const value = fact.spatial;
    if (value.phase === "arrived") return [f.fact({ ...f.requested, kind: "route_order_restore", source: f.product,
      reason: "restore_attempt" }), { ...fact, spatial: { ...value, caller: value.caller && { ...value.caller, lifetimeValid: false } } }];
    return [{ ...fact, spatial: { ...value, caller: value.phase === "returned_true" && value.caller ?
      { ...value.caller, lifetimeValid: false } : value.caller } }];
  }).map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.movements[0]).toMatchObject({ callerAttributed: false, admission: null, arrival: "unavailable" });
  const revived = facts.map((fact): AiRuntimeProductionFactV1 => fact.kind === "spatial_authority" &&
    fact.spatial.kind === "movement" ? { ...fact, spatial: { ...fact.spatial, caller: f.value.caller } } : fact);
  expect(normalizeRuntimeMovement({ ...f.capture, facts: revived }).failures)
    .toContain("production_route_query_caller_lifetime_revived");
});

for (const invalid of ["orphan", "probe", "endpoint", "duplicate_terminal", "after_return"] as const) {
  test(`contradictory ${invalid} suppresses normalized report groups`, () => {
    const f = fixture();
    const tail = { ...f.value, phase: "arrived", selectedDestination: { x: 8, y: 9 }, actualTile: { x: 8, y: 9 },
      executionId: invalid === "orphan" ? 2 : 1,
      originalDestination: invalid === "endpoint" ? { x: 9, y: 9 } : f.value.originalDestination,
      caller: invalid === "probe" ? { ...f.value.caller, caller: "range_probe" } : f.value.caller
    } satisfies AiRuntimeProductionSpatialV1;
    const existing = invalid === "after_return" ? f.capture.facts : f.capture.facts.filter((fact) =>
      fact.kind !== "spatial_authority" || fact.spatial.kind !== "movement" || fact.spatial.phase !== "returned_true");
    const facts = [...existing, f.fact(tail)].map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures.length).toBeGreaterThan(0); expect(result.movements).toEqual([]);
    expect(result.producerRoutes.paths).toEqual([]);
  });
}

test("overflow drops the whole movement group while still inspecting contradictory tail records", () => {
  const f = fixture();
  const tail = Array.from({ length: 256 }, (_, index) => f.fact({ ...f.value, executionId: index + 2 }));
  const facts = [...f.capture.facts, ...tail].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeMovement({ ...f.capture, facts });
  expect(result.failures).toEqual([]); expect(result.movements).toEqual([]);
  expect(result.gaps).toContain("production_movement_group_overflow");
  facts.push({ ...f.fact({ ...f.value, executionId: 257, phase: "arrived", selectedDestination: null }), sequence: facts.length + 1 });
  expect(normalizeRuntimeMovement({ ...f.capture, facts }).failures).toContain("production_movement_interval_invalid");
});
