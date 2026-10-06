import { expect, test } from "@playwright/test";
import type { AiRuntimeNavigationBoundaryV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-navigation-boundary-v1";
import { productionSpatialFixture } from "./skirmish-ai-runtime-production-spatial-fixture";
import { normalizeRuntimeProductionSpatial } from "./skirmish-ai-runtime-production-spatial-normalization";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

/** The report consumes exact synthetic query boundaries. None of these fixtures prove cached-path freshness. */
function interval(before?: AiRuntimeNavigationBoundaryV1, after?: AiRuntimeNavigationBoundaryV1) {
  const f = productionSpatialFixture();
  return { ...f.capture, facts: [
    f.fact({ ...f.requested, navigation: before }, 1),
    f.fact({ ...f.resolved, navigation: after }, 2)
  ] };
}

test("equal observed topology stays separate from same-tick actor binding and missing freshness authority", () => {
  const boundary = { graphObservationId: 1, updateRequestCount: 0 };
  const result = normalizeRuntimeProductionSpatial(interval(boundary, boundary));
  expect(result.failures).toEqual([]);
  expect(result.authority.paths[0]).toMatchObject({ currentAtResolution: true, topologyObservation: "same_observed" });
  expect(result.gaps).toContain("production_spatial_path_cache_provenance_missing");
  expect(result.gaps).toContain("production_spatial_navigation_history_unverified");
  expect(result.gaps).toContain("production_spatial_navigation_revision_missing");
  expect(result.gaps).toContain("production_spatial_full_producer_reachability_missing");
  expect(result.gaps).not.toContain("production_spatial_path_topology_changed");
  const report = normalizeRuntimeProductionCausality(interval(boundary, boundary));
  expect(report.failures).toEqual([]);
  expect(report.spatialAuthority.paths[0]?.topologyObservation).toBe("same_observed");
});

test("graph replacement and throttled update requests each flag change without rewriting native path evidence", () => {
  const before = { graphObservationId: 1, updateRequestCount: 0 };
  for (const after of [
    { graphObservationId: 2, updateRequestCount: 0 },
    { graphObservationId: 1, updateRequestCount: 1 },
    { graphObservationId: 2, updateRequestCount: 1 }
  ]) {
    const capture = interval(before, after);
    const result = normalizeRuntimeProductionSpatial(capture);
    expect(result.failures).toEqual([]);
    expect(result.authority.paths[0]).toMatchObject({ currentAtResolution: true, topologyObservation: "changed" });
    expect(result.authority.paths[0]?.resolved).toEqual(capture.facts[1]);
    expect(result.gaps).toContain("production_spatial_path_topology_changed");
    expect(result.gaps).toContain("production_spatial_path_cache_provenance_missing");
  }
});

test("legacy, unavailable graph and exhausted observation cannot be backfilled from another boundary", () => {
  const available = { graphObservationId: 1, updateRequestCount: 0 };
  for (const capture of [
    interval(), interval(undefined, available), interval(available, undefined),
    interval({ graphObservationId: null, updateRequestCount: 0 }, available),
    interval(available, { graphObservationId: null, updateRequestCount: 0 }),
    interval(available, { graphObservationId: null, updateRequestCount: null })
  ]) {
    const result = normalizeRuntimeProductionSpatial(capture);
    expect(result.failures).toEqual([]);
    expect(result.authority.paths[0]?.topologyObservation).toBe("unavailable");
    expect(result.gaps).toContain("production_spatial_navigation_boundary_missing");
    expect(result.gaps).toContain("production_spatial_navigation_history_unverified");
  }
});

test("invalid or regressing counters fail all normalized groups, including native failure intervals", () => {
  for (const [before, after] of [
    [{ graphObservationId: 0, updateRequestCount: 0 }, { graphObservationId: 1, updateRequestCount: 0 }],
    [{ graphObservationId: 1, updateRequestCount: 0 }, { graphObservationId: 1, updateRequestCount: -1 }],
    [{ graphObservationId: 1, updateRequestCount: 0 }, { graphObservationId: 1, updateRequestCount: NaN }],
    [{ graphObservationId: 1, updateRequestCount: 0 }, { graphObservationId: 1.5, updateRequestCount: 0 }],
    [{ graphObservationId: 1, updateRequestCount: 0 }, { graphObservationId: 1, updateRequestCount: 0.5 }],
    [{ graphObservationId: 1, updateRequestCount: 0 }, { graphObservationId: 1, updateRequestCount: 8193 }],
    [{ graphObservationId: 1, updateRequestCount: 0 }, { graphObservationId: 8193, updateRequestCount: 0 }],
    [{ graphObservationId: 1, updateRequestCount: 0 }, { graphObservationId: 1, updateRequestCount: null }],
    [{ graphObservationId: 2, updateRequestCount: 0 }, { graphObservationId: 1, updateRequestCount: 0 }],
    [{ graphObservationId: 1, updateRequestCount: 2 }, { graphObservationId: 1, updateRequestCount: 1 }],
    [{ graphObservationId: null, updateRequestCount: null }, { graphObservationId: 1, updateRequestCount: 0 }]
  ] satisfies readonly (readonly [AiRuntimeNavigationBoundaryV1, AiRuntimeNavigationBoundaryV1])[]) {
    for (const failed of [false, true]) {
      const capture = interval(before, after);
      const facts = failed ? capture.facts.map((fact) => fact.kind === "spatial_authority" &&
        fact.spatial.kind === "builder_path" && fact.spatial.phase === "resolved"
        ? { ...fact, spatial: { ...fact.spatial, phase: "rejected" as const, result: null, path: null } } : fact) : capture.facts;
      const result = normalizeRuntimeProductionCausality({ ...capture, facts });
      expect(result.failures.some((failure) => failure.startsWith("production_spatial_navigation_"))).toBe(true);
      expect(result.spatialAuthority).toEqual({ placements: [], spawns: [], paths: [] });
      expect(result.constructionCatalog).toEqual([]);
      expect(result.effectRetention).toEqual([]);
      expect(result.decisions).toEqual([]); expect(result.worldSnapshots).toEqual([]);
      expect(result.payments).toEqual([]);
    }
  }
});

test("legacy and missing graph samples do not erase the last known capture-local counter", () => {
  const f = productionSpatialFixture();
  for (const middle of [undefined, { graphObservationId: null, updateRequestCount: 3 }]) {
    const capture = { ...f.capture, facts: [
      f.fact({ ...f.requested, navigation: { graphObservationId: 4, updateRequestCount: 3 } }, 1),
      f.fact({ ...f.requested, queryId: 2, navigation: middle }, 2),
      f.fact({ ...f.resolved, navigation: { graphObservationId: 3, updateRequestCount: 3 } }, 3)
    ] };
    const result = normalizeRuntimeProductionSpatial(capture);
    expect(result.failures).toContain("production_spatial_navigation_counter_regressed");
    expect(result.authority.paths).toEqual([]);
  }
});
