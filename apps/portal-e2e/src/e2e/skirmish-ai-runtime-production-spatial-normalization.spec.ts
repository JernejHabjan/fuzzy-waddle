import { expect, test } from "@playwright/test";
import { productionSpatialFixture } from "./skirmish-ai-runtime-production-spatial-fixture";
import { normalizeRuntimeProductionSpatial } from "./skirmish-ai-runtime-production-spatial-normalization";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

test("keeps native placement, exact query interval and spawn separate without promoting general reachability", () => {
  const f = productionSpatialFixture(); const result = normalizeRuntimeProductionSpatial(f.capture);
  expect(result.failures).toEqual([]);
  expect(result.authority.placements).toHaveLength(1); expect(result.authority.spawns).toHaveLength(1);
  expect(result.authority.paths[0]).toMatchObject({ currentAtResolution: true,
    requested: { sequence: 2 }, resolved: { sequence: 3, spatial: { path: f.resolved.path } } });
  expect(result.gaps).toContain("production_spatial_full_producer_reachability_missing");
  expect(result.gaps).toContain("production_spatial_construction_application_missing");
});

test("joins actual native placement/delivery/application while keeping AI decision and future reachability unproven", () => {
  const f = productionSpatialFixture();
  const delivery = { sequence: 3, tick: 20, playerNumber: 1, kind: "command_delivered" as const, command: f.placement.command };
  const applied = { sequence: 4, tick: 20, playerNumber: 1, kind: "outcome" as const, scheduledTick: null,
    outcome: { schemaVersion: 1 as const, tick: 20, playerNumber: 1, kind: "applied" as const, reason: "applied" as const,
      commandId: "construction", commitmentKey: "construction", authorityEpoch: 0, sequence: 1,
      actorIds: ["builder"], worldLinkIds: ["site"] } };
  const capture = { ...f.capture, facts: [f.fact(f.placement, 1), f.fact(f.requested, 2), delivery, applied, f.fact(f.resolved, 5)] };
  const result = normalizeRuntimeProductionSpatial(capture);
  expect(result.failures).toEqual([]);
  expect(result.authority.paths[0]?.constructionPlacement?.sequence).toBe(1);
  expect(result.gaps).toContain("production_spatial_construction_ai_decision_link_missing");
  const bad = normalizeRuntimeProductionSpatial({ ...capture, facts: capture.facts.map((fact) => fact.kind === "outcome"
    ? { ...fact, outcome: { ...fact.outcome, worldLinkIds: ["other-site"] } } : fact) });
  expect(bad.failures).toContain("production_spatial_construction_application_mismatch");
  const future = normalizeRuntimeProductionSpatial({ ...capture, facts: [
    f.fact(f.placement, 1), f.fact(f.requested, 2), f.fact(f.resolved, 3),
    { ...delivery, sequence: 4 }, { ...applied, sequence: 5 }
  ] });
  expect(future.failures).toContain("production_spatial_construction_application_mismatch");
  const late = normalizeRuntimeProductionSpatial({ ...capture, facts: capture.facts.map((fact) =>
    fact.kind === "spatial_authority" && fact.spatial.kind === "builder_path" && fact.spatial.phase === "resolved"
      ? { ...fact, tick: 21, spatial: { ...fact.spatial, clockTick: 21 } } : fact) });
  expect(late.failures).toEqual([]); expect(late.authority.paths[0]?.currentAtResolution).toBe(false);
  expect(late.gaps).toContain("production_spatial_path_history_continuity_unverified");
});

test("empty success, null failure, late/stale binding and pending queries remain distinct", () => {
  const f = productionSpatialFixture();
  for (const resolved of [{ ...f.resolved, path: [] }, { ...f.resolved, path: null, result: "no_path" as const },
    { ...f.resolved, sourceTile: { x: 6, y: 9 } },
    { ...f.resolved, path: null, gaps: ["production_spatial_path_overflow"] }]) {
    const result = normalizeRuntimeProductionSpatial({ ...f.capture, facts: [f.fact(f.requested, 1), f.fact(resolved, 2)] });
    expect(result.failures).toEqual([]); expect(result.authority.paths).toHaveLength(1);
    if (resolved.sourceTile.x !== f.requested.sourceTile.x) {
      expect(result.authority.paths[0]?.currentAtResolution).toBe(false);
      expect(result.gaps).toContain("production_spatial_path_stale_binding");
    }
  }
  const pending = normalizeRuntimeProductionSpatial({ ...f.capture, facts: [f.fact(f.requested, 1)] });
  expect(pending.authority.paths).toEqual([]); expect(pending.gaps).toContain("production_spatial_path_pending_or_missing");
  const placementOnly = normalizeRuntimeProductionSpatial({ ...f.capture, facts: [f.fact(f.placement, 1)] });
  expect(placementOnly.authority.paths).toEqual([]);
});

test("contradictory ownership, callbacks, clocks, footprint and spawn values invalidate the complete normalized group", () => {
  const f = productionSpatialFixture();
  for (const facts of [
    [f.fact(f.resolved, 1)], [f.fact(f.requested, 1), f.fact(f.resolved, 2), f.fact(f.resolved, 3)],
    [f.fact({ ...f.placement, snapshotRestoreInProgress: true }, 1)],
    [{ ...f.fact(f.placement, 1), tick: 21 }],
    [f.fact({ ...f.placement, footprint: [] }, 1)],
    [f.fact({ ...f.placement, footprint: [], clockTick: null }, 1)],
    [f.fact({ ...f.placement, command: { ...f.placement.command, actorName: f.requested.source.canonicalObjectName } }, 1)],
    [f.fact({ ...f.spawn, position: null }, 1)],
    [f.fact(f.requested, 1), f.fact({ ...f.resolved, target: { ...f.resolved.target, playerNumber: 2 } }, 2)],
    [f.fact(f.requested, 1), f.fact({ ...f.resolved, path: [{ x: NaN, y: 9 }] }, 2)]
  ]) {
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.spatialAuthority).toEqual({ placements: [], paths: [], spawns: [] });
    expect(result.decisions).toEqual([]); expect(result.worldSnapshots).toEqual([]);
    expect(result.payments).toEqual([]); expect(result.completions).toEqual([]);
  }
});
