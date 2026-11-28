// Keep the entire serial test within three minutes, independently of the selected tick horizons.
// Refocus oversized recipes (especially H-10's 128-command backlog) or split selections instead of raising this ceiling.
const MAX_RUNTIME_TIMEOUT_MS = 3 * 60_000;

/** @param {number} variantRuns @param {number} maximumVariantTicks */
export function skirmishRuntimeTestTimeoutMs(variantRuns: number, maximumVariantTicks = 0): number {
  if (
    !Number.isSafeInteger(variantRuns) ||
    variantRuns < 0 ||
    !Number.isSafeInteger(maximumVariantTicks) ||
    maximumVariantTicks < 0
  ) {
    throw new Error("invalid_runtime_timeout_budget");
  }
  return MAX_RUNTIME_TIMEOUT_MS;
}
