const MIN_RUNTIME_TIMEOUT_MS = 600_000;
const MAX_RUNTIME_TIMEOUT_MS = 30 * 60_000;
const STARTUP_AND_SEAL_TIMEOUT_MS = 180_000;
const PER_TICK_TIMEOUT_MS = 450;

/** @param {number} variantRuns @param {number} maximumVariantTicks */
export function skirmishRuntimeTestTimeoutMs(variantRuns, maximumVariantTicks = 0) {
  if (
    !Number.isSafeInteger(variantRuns) ||
    variantRuns < 0 ||
    !Number.isSafeInteger(maximumVariantTicks) ||
    maximumVariantTicks < 0
  ) {
    throw new Error("invalid_runtime_timeout_budget");
  }
  const perVariantTimeout = Math.max(MIN_RUNTIME_TIMEOUT_MS, maximumVariantTicks * PER_TICK_TIMEOUT_MS);
  return Math.min(
    MAX_RUNTIME_TIMEOUT_MS,
    Math.max(MIN_RUNTIME_TIMEOUT_MS, STARTUP_AND_SEAL_TIMEOUT_MS + variantRuns * perVariantTimeout)
  );
}
