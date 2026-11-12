import type { NavigationNativeBoundary } from
  "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation-native-boundary";
import type { NavigationNativeQuery } from
  "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation-native-query";

/** Native milestones validate independently of capture-local graph references and throttled request counts. */
export function validateRuntimeNativeBoundary(
  value: NavigationNativeBoundary | null | undefined, previous?: NavigationNativeBoundary | null
): string[] {
  if (value === undefined) return [];
  if (value === null) return [];
  if (typeof value !== "object") return ["production_spatial_native_boundary_invalid"];
  const counters = [value.completedRebuild, value.groundConfiguration, value.waterConfiguration,
    value.groundCacheClear, value.waterCacheClear];
  if (typeof value.rebuildInProgress !== "boolean" ||
    !counters.every((count) => Number.isSafeInteger(count) && count >= 0 && count <= 8192) ||
    value.completedRebuild > Math.min(value.groundConfiguration, value.groundCacheClear, value.waterCacheClear) ||
    value.completedRebuild > 0 && value.waterConfiguration === 0) return ["production_spatial_native_boundary_invalid"];
  if (previous === null) return ["production_spatial_native_boundary_revived"];
  if (previous && (value.completedRebuild < previous.completedRebuild ||
    value.groundConfiguration < previous.groundConfiguration || value.waterConfiguration < previous.waterConfiguration ||
    value.groundCacheClear < previous.groundCacheClear || value.waterCacheClear < previous.waterCacheClear ||
    previous.rebuildInProgress && !value.rebuildInProgress && value.completedRebuild === previous.completedRebuild)) {
    return ["production_spatial_native_boundary_regressed"];
  }
  return [];
}

/** Validate even failed queries and overflow tails. A missing native record remains a gap, never a later backfill. */
export function validateRuntimeNativeQuery(
  query: NavigationNativeQuery | undefined, before?: NavigationNativeBoundary | null,
  after?: NavigationNativeBoundary | null, resolved = false
): string[] {
  if (query === undefined) return [];
  const bad = ["production_spatial_native_query_invalid"];
  if (!query || typeof query !== "object" || !Number.isSafeInteger(query.queryId) || query.queryId < 1 || query.queryId > 8192 ||
    !["ground_static", "ground_overlay", "water_static"].includes(query.engine) ||
    !["hit", "miss", "bypass"].includes(query.cache)) return bad;
  const tile = (value: typeof query.from) => value && Number.isSafeInteger(value.x) && value.x >= 0 &&
    Number.isSafeInteger(value.y) && value.y >= 0;
  if (!tile(query.from) || !tile(query.to) || query.requested === undefined || query.completed === undefined ||
    query.entry === undefined) return bad;
  if (query.engine === "ground_overlay" ? query.cache !== "bypass" || query.requestTimeMs !== null || query.entry !== null :
    query.cache === "bypass" || query.requestTimeMs === null || !Number.isFinite(query.requestTimeMs) || query.requestTimeMs < 0) {
    return bad;
  }
  const failures = [...validateRuntimeNativeBoundary(query.requested, before),
    ...validateRuntimeNativeBoundary(query.completed, query.requested),
    ...validateRuntimeNativeBoundary(after, query.completed ?? query.requested)];
  if (resolved && query.completed === null && after != null) failures.push(...bad);
  if (query.cache !== "hit") {
    if (query.entry !== null) failures.push(...bad);
  } else if (query.entry !== null) {
    const entry = query.entry;
    if (typeof entry !== "object" || !Number.isSafeInteger(entry.queryId) || entry.queryId < 1 || entry.queryId >= query.queryId ||
      !Number.isFinite(entry.requestTimeMs) || entry.requestTimeMs < 0 || query.requestTimeMs === null ||
      query.requestTimeMs < entry.requestTimeMs || query.requestTimeMs - entry.requestTimeMs >= 1000 ||
      entry.requested === undefined || entry.stored === undefined) failures.push(...bad);
    else failures.push(...validateRuntimeNativeBoundary(entry.requested),
      ...validateRuntimeNativeBoundary(entry.stored, entry.requested),
      ...validateRuntimeNativeBoundary(query.requested, entry.stored));
  }
  return [...new Set(failures)];
}

/** Stable schema-only identity permits the same nested native lookup in two caller scopes, never conflicting lineage. */
export function runtimeNativeQueryFingerprint(query: NavigationNativeQuery): string {
  const boundary = (value: NavigationNativeBoundary | null) => value ? [value.completedRebuild, value.rebuildInProgress,
    value.groundConfiguration, value.waterConfiguration, value.groundCacheClear, value.waterCacheClear] : null;
  return JSON.stringify([query.engine, query.from.x, query.from.y, query.to.x, query.to.y, query.cache, query.requestTimeMs,
    boundary(query.requested), boundary(query.completed), query.entry ? [query.entry.queryId, query.entry.requestTimeMs,
      boundary(query.entry.requested), boundary(query.entry.stored)] : null]);
}
