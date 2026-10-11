import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";

/** Adds diagnostic failures only for mandatory causal production rows; it never replaces their full evidence oracle. */
export function evaluateRuntimeProductionCausality(
  scenarioId: string, causality: RuntimeProductionCausalityV1 | undefined
): string[] {
  if (!["PRO-03", "PRO-06", "PRO-07"].includes(scenarioId) || !causality) return [];
  return [...new Set([...causality.failures, ...causality.gaps.map((gap) => `production_capture_gap:${gap}`)])];
}
