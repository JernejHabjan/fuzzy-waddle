import { expect, test } from "@playwright/test";
import type { NavigationNativeBoundary } from
  "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation-native-boundary";
import type { NavigationNativeQuery } from
  "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation-native-query";
import { productionSpatialFixture } from "./skirmish-ai-runtime-production-spatial-fixture";
import { producerRouteFixture } from "./skirmish-ai-runtime-producer-route-fixture";
import { normalizeRuntimeProductionSpatial } from "./skirmish-ai-runtime-production-spatial-normalization";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { validateRuntimeNativeQuery } from "./skirmish-ai-runtime-native-navigation-validation";

const first = { completedRebuild: 1, rebuildInProgress: false, groundConfiguration: 1, waterConfiguration: 1,
  groundCacheClear: 1, waterCacheClear: 2 } satisfies NavigationNativeBoundary;
const second = { ...first, completedRebuild: 2, groundConfiguration: 2, groundCacheClear: 2, waterCacheClear: 3 };
const observed = (native: NavigationNativeBoundary | null) => ({ graphObservationId: 1, updateRequestCount: 0, native });
const query = { queryId: 2, engine: "ground_static", from: { x: 5, y: 9 }, to: { x: 6, y: 9 }, cache: "miss",
  requestTimeMs: 100, requested: first, completed: first, entry: null } satisfies NavigationNativeQuery;

/** Synthetic report consumption only; no route here proves arrival, effective usefulness or real cached topology. */
function interval(nativeQuery: NavigationNativeQuery | undefined = query,
  before: NavigationNativeBoundary | null = first, after: NavigationNativeBoundary | null = first) {
  const f = productionSpatialFixture();
  return { ...f.capture, facts: [f.fact({ ...f.requested, navigation: observed(before) }, 1),
    f.fact({ ...f.resolved, navigation: observed(after), nativeQuery }, 2)] };
}

test("reports completed milestones separately from graph observations and retains mandatory history gaps", () => {
  const result = normalizeRuntimeProductionSpatial(interval());
  expect(result.failures).toEqual([]);
  expect(result.authority.paths[0]).toMatchObject({ topologyObservation: "same_observed", nativeNavigation: {
    completedRebuildInterval: "same_completed", cacheLineage: "same_requested_generation", query } });
  expect(result.gaps).not.toContain("production_spatial_navigation_revision_missing");
  expect(result.gaps).not.toContain("production_spatial_path_cache_provenance_missing");
  expect(result.gaps).toContain("production_spatial_native_cache_mutable_result_history_missing");
  expect(result.gaps).toContain("production_spatial_navigation_history_unverified");
  expect(result.gaps).toContain("production_spatial_full_producer_reachability_missing");
});

test("an old pending callback cache refill keeps older request generation even with current insertion and lookup", () => {
  const hit = { ...query, cache: "hit", requested: second, completed: second, entry: { queryId: 1,
    requestTimeMs: 50, requested: first, stored: second } } satisfies NavigationNativeQuery;
  const result = normalizeRuntimeProductionSpatial(interval(hit, second, second));
  expect(result.failures).toEqual([]);
  expect(result.authority.paths[0]?.nativeNavigation).toMatchObject({ completedRebuildInterval: "same_completed",
    cacheLineage: "older_request_generation" });
  expect(result.gaps).toContain("production_spatial_native_cache_older_request");
  const changed = normalizeRuntimeProductionSpatial(interval({ ...query, completed: second }, first, second));
  expect(changed.authority.paths[0]?.nativeNavigation.completedRebuildInterval).toBe("changed");
});

test("native absence, partial rebuild and exhausted counters cannot become completed/fresh history", () => {
  for (const capture of [interval(query, first, { ...first, rebuildInProgress: true }),
    interval({ ...query, completed: null }, first, null)]) {
    const result = normalizeRuntimeProductionSpatial(capture);
    expect(result.failures).toEqual([]);
    expect(result.gaps).toContain("production_spatial_navigation_history_unverified");
  }
  const legacy = interval();
  legacy.facts = legacy.facts.map((fact) => fact.kind === "spatial_authority" && fact.spatial.kind === "builder_path"
    ? { ...fact, spatial: { ...fact.spatial, navigation: undefined, nativeQuery: undefined } } : fact);
  expect(normalizeRuntimeProductionSpatial(legacy).gaps).toContain("production_spatial_navigation_revision_missing");
});

test("a native cache clear without a completed rebuild remains separate from rebuild and entry lineage", () => {
  const cleared = { ...first, groundCacheClear: 2 };
  const result = normalizeRuntimeProductionSpatial(interval({ ...query, completed: cleared }, first, cleared));
  expect(result.failures).toEqual([]);
  expect(result.authority.paths[0]?.nativeNavigation).toMatchObject({ completedRebuildInterval: "same_completed",
    queryGenerationAtTerminal: "changed", cacheLineage: "same_requested_generation" });
  expect(result.gaps).toContain("production_spatial_native_generation_changed_at_terminal");
});

test("producer dynamic water fallback and uncached ground overlays reach the existing causality report", () => {
  for (const engine of ["ground_overlay", "water_static"] as const) {
    const f = producerRouteFixture();
    const nativeQuery = { ...query, from: f.requested.sourceTile, to: f.requested.targetTile, engine,
      cache: engine === "ground_overlay" ? "bypass" : "miss", requestTimeMs: engine === "ground_overlay" ? null : 100 }
      satisfies NavigationNativeQuery;
    const capture = { ...f.capture, facts: f.capture.facts.map((fact) => fact.kind === "spatial_authority" &&
      fact.spatial.kind === "producer_path" ? { ...fact, spatial: { ...fact.spatial, method: "tile_dynamic" as const,
        dynamicBlockerCount: 1, navigation: observed(first),
        nativeQuery: fact.spatial.phase === "resolved" ? nativeQuery : undefined } } : fact) };
    const result = normalizeRuntimeProductionCausality(capture);
    expect(result.failures).toEqual([]);
    expect(result.producerRoutes.paths[0]?.nativeNavigation.cacheLineage).toBe(engine === "ground_overlay"
      ? "uncached_overlay" : "same_requested_generation");
    expect(result.gaps).toContain("production_route_useful_arrival_missing");
    expect(result.gaps).toContain("production_route_complete_query_history_missing");
  }
});

test("cache TTL, insertion/request counters, engines, identifiers and failure metadata fail closed", () => {
  const entry = { queryId: 1, requestTimeMs: 50, requested: first, stored: first };
  const hit = { ...query, cache: "hit", entry } satisfies NavigationNativeQuery;
  for (const value of [
    { ...query, queryId: 8193 }, { ...query, queryId: 0 }, { ...query, requestTimeMs: NaN },
    { ...query, cache: "bypass" }, { ...query, entry }, { ...query, requested: { ...first, groundConfiguration: 0 } },
    { ...query, completed: null }, { ...query, completed: { ...first, groundCacheClear: 0 } },
    { ...hit, entry: { ...entry, queryId: 2 } }, { ...hit, entry: { ...entry, requestTimeMs: 101 } },
    { ...hit, requestTimeMs: 1050 }, { ...hit, entry: { ...entry, stored: second } }
  ] satisfies NavigationNativeQuery[]) {
    const result = normalizeRuntimeProductionCausality(interval(value));
    expect(result.failures.some((failure) => failure.startsWith("production_spatial_native_"))).toBe(true);
    expect(result.spatialAuthority).toEqual({ placements: [], spawns: [], paths: [] });
    expect(result.producerRoutes).toEqual({ outputs: [], paths: [] });
    expect(result.decisions).toEqual([]);
  }
  expect(validateRuntimeNativeQuery({ ...query, completed: null }, first, first, false)).toEqual([]);
});

test("native loss, regressions and conflicting shared query identities are inspected across all caller kinds and tails", () => {
  const f = productionSpatialFixture();
  const tail = { ...f.resolved, queryId: 2, nativeQuery: { ...query, requestTimeMs: 200 }, navigation: observed(first) };
  const conflict = { ...interval(), facts: [...interval().facts, f.fact({ ...f.requested, queryId: 2,
    navigation: observed(first) }, 3), f.fact(tail, 4)] };
  expect(normalizeRuntimeProductionSpatial(conflict).failures).toContain("production_spatial_native_query_identity_conflict");
  for (const [before, after] of [[second, first], [null, first]] satisfies
    (readonly [NavigationNativeBoundary | null, NavigationNativeBoundary])[]) {
    const result = normalizeRuntimeProductionCausality(interval(query, before, after));
    expect(result.failures.length).toBeGreaterThan(0); expect(result.spatialAuthority.paths).toEqual([]);
  }
});

test("a malformed native lookup after producer group overflow still suppresses every normalized group", () => {
  const f = producerRouteFixture();
  const added = Array.from({ length: 257 }, (_, index) => {
    const queryId = index + 2;
    const requested = { ...f.requested, queryId, navigation: observed(first) };
    const nativeQuery = { ...query, queryId: index + 3, from: f.requested.sourceTile, to: f.requested.targetTile,
      requestTimeMs: index === 256 ? NaN : 100 };
    return [f.fact(requested), f.fact({ ...f.resolved, queryId, navigation: observed(first), nativeQuery })];
  }).flat();
  const capture = { ...f.capture, facts: [...f.capture.facts, ...added].map((fact, index) => ({ ...fact, sequence: index + 1 })) };
  const result = normalizeRuntimeProductionCausality(capture);
  expect(result.failures).toContain("production_spatial_native_query_invalid");
  expect(result.gaps).toContain("production_route_group_overflow");
  expect(result.producerRoutes).toEqual({ outputs: [], paths: [] });
  expect(result.spatialAuthority).toEqual({ placements: [], spawns: [], paths: [] });
  expect(result.effectRetention).toEqual([]);
});
