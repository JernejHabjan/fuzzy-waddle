import type { AiRuntimeNavigationBoundaryV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-navigation-boundary-v1";
import type { NavigationNativeQuery } from
  "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation-native-query";

/** Diagnostics compare native generations, never assert path immutability, arrival or a complete query history. */
export function projectRuntimeNativeNavigation(
  before: AiRuntimeNavigationBoundaryV1 | undefined, after: AiRuntimeNavigationBoundaryV1 | undefined,
  query: NavigationNativeQuery | undefined
) {
  const left = before?.native, right = after?.native;
  const gaps: string[] = [];
  const completedRebuildInterval: "same_completed" | "changed" | "unavailable" =
    !left || !right || left.completedRebuild === 0 || right.completedRebuild === 0 ||
      left.rebuildInProgress || right.rebuildInProgress ? "unavailable" :
      left.completedRebuild === right.completedRebuild ? "same_completed" : "changed";
  let cacheLineage: "same_requested_generation" | "older_request_generation" | "uncached_overlay" | "unavailable" = "unavailable";
  const start = query?.requested;
  const queryGenerationAtTerminal: "same_native_generation" | "changed" | "unavailable" =
    !query || !start || !right || start.completedRebuild === 0 || right.completedRebuild === 0 ||
      start.rebuildInProgress || right.rebuildInProgress ? "unavailable" :
      start.completedRebuild !== right.completedRebuild || (query.engine === "water_static" ?
        start.waterConfiguration !== right.waterConfiguration || start.waterCacheClear !== right.waterCacheClear :
        start.groundConfiguration !== right.groundConfiguration || start.groundCacheClear !== right.groundCacheClear)
        ? "changed" : "same_native_generation";
  const origin = query?.cache === "hit" ? query.entry?.requested : start;
  if (query?.engine === "ground_overlay") cacheLineage = "uncached_overlay";
  else if (query && start && origin && !start.rebuildInProgress && !origin.rebuildInProgress &&
    start.completedRebuild > 0 && origin.completedRebuild > 0) {
    const ground = query.engine === "ground_static";
    const same = start.completedRebuild === origin.completedRebuild &&
      (ground ? start.groundConfiguration === origin.groundConfiguration && start.groundCacheClear === origin.groundCacheClear :
        start.waterConfiguration === origin.waterConfiguration && start.waterCacheClear === origin.waterCacheClear);
    cacheLineage = same ? "same_requested_generation" : "older_request_generation";
  }
  if (!query) gaps.push("production_spatial_native_query_missing_or_ambiguous");
  if (cacheLineage === "unavailable") gaps.push("production_spatial_path_cache_provenance_missing");
  if (cacheLineage === "older_request_generation") gaps.push("production_spatial_native_cache_older_request");
  if (query && query.engine !== "ground_overlay") gaps.push("production_spatial_native_cache_mutable_result_history_missing");
  if (completedRebuildInterval === "unavailable") gaps.push("production_spatial_navigation_revision_missing");
  if (completedRebuildInterval === "changed") gaps.push("production_spatial_native_rebuild_during_query");
  if (queryGenerationAtTerminal === "changed") gaps.push("production_spatial_native_generation_changed_at_terminal");
  if (queryGenerationAtTerminal === "unavailable") gaps.push("production_spatial_native_query_terminal_generation_missing");
  // Even same generation lacks occupancy, actor movement, effective destination and useful arrival continuity.
  gaps.push("production_spatial_navigation_history_unverified");
  return { query: query ?? null, completedRebuildInterval, queryGenerationAtTerminal, cacheLineage, gaps };
}
