import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import type { AiRuntimeProductionBoundaryState } from "./ai-runtime-production-boundary-state";

export const AI_RUNTIME_MAX_FACTS = 8192;

/** Single root budget for all channels. Loss precedes fallible diagnostics; sequence ownership remains with the capture. */
export function appendAiRuntimeProductionFact(facts: AiRuntimeProductionFactV1[], fact: AiRuntimeProductionFactV1,
  sequence: number, sample: () => AiRuntimeProductionBoundaryState,
  lose: (reason: string) => void, dropped: () => void): void {
  if (facts.length >= AI_RUNTIME_MAX_FACTS) { lose("fact_overflow"); dropped(); return; }
  try {
    const boundaryState = [
      "decision_selected", "intent_dispatch", "outcome", "queue_resource", "queue_changed", "command_delivered",
      "queue_progress", "queue_mutation", "queue_completion", "actor_registered", "research_completed"
    ].includes(fact.kind) ? sample() : undefined;
    facts.push(structuredClone({ ...fact, sequence, ...(boundaryState ? { boundaryState } : {}) }));
  } catch (error) { lose("fact_append_failed"); throw error; }
}
