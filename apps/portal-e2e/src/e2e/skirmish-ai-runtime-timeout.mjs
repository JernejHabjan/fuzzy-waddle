const MIN_RUNTIME_TIMEOUT_MS = 600_000;
const STARTUP_AND_SEAL_TIMEOUT_MS = 180_000;
const PER_VARIANT_TIMEOUT_MS = 600_000;

/** @param {number} variantRuns */
export function skirmishRuntimeTestTimeoutMs(variantRuns) {
  if (!Number.isSafeInteger(variantRuns) || variantRuns < 0) {
    throw new Error("invalid_runtime_variant_count");
  }
  return Math.max(MIN_RUNTIME_TIMEOUT_MS, STARTUP_AND_SEAL_TIMEOUT_MS + variantRuns * PER_VARIANT_TIMEOUT_MS);
}
