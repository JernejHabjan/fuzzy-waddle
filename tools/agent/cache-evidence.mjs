/**
 * Classifies explicit cache diagnostics without treating generic mentions of "cache" as hits or misses.
 * Tool-specific cache formats stay intentionally conservative until an adapter supplies a stronger parser.
 */
export function inspectCacheEvidence(output) {
  if (typeof output !== "string") throw new Error("invalid_cache_output");
  const hitCount = count(output, /\b(?:cache hit|read from cache|retrieved from cache)\b/giu);
  const missCount = count(output, /\b(?:cache miss|cache bypass|cache not found)\b/giu);
  return {
    status: cacheStatus(hitCount, missCount),
    hitCount,
    missCount,
    mentionCount: count(output, /\bcache\b/giu)
  };
}

function count(value, expression) {
  return [...value.matchAll(expression)].length;
}

function cacheStatus(hitCount, missCount) {
  if (hitCount > 0 && missCount > 0) return "mixed";
  if (hitCount > 0) return "hit";
  if (missCount > 0) return "miss";
  return "not_reported";
}
