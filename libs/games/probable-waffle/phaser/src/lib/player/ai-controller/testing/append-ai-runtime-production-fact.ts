import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import type { AiRuntimeProductionBoundaryState } from "./ai-runtime-production-boundary-state";

/** Bounded aggregate budget covers the 33,823-fact native escort capture with 3k facts of headroom. */
export const AI_RUNTIME_MAX_FACTS = 36_864;

/** Single root budget for all channels. Loss precedes fallible diagnostics; sequence ownership remains with the capture. */
export function appendAiRuntimeProductionFact(
  facts: AiRuntimeProductionFactV1[],
  fact: AiRuntimeProductionFactV1,
  sequence: number,
  sample: () => AiRuntimeProductionBoundaryState,
  lose: (reason: string) => void,
  dropped: () => void
): void {
  if (facts.length >= AI_RUNTIME_MAX_FACTS) {
    lose("fact_overflow");
    dropped();
    return;
  }
  try {
    const boundaryState = [
      "preset_control",
      "decision_selected",
      "intent_dispatch",
      "outcome",
      "queue_resource",
      "queue_changed",
      "command_delivered",
      "queue_progress",
      "queue_mutation",
      "queue_completion",
      "actor_registered",
      "research_completed",
      "construction_authority",
      "actor_unregistered",
      "spatial_authority"
    ].includes(fact.kind)
      ? sample()
      : undefined;
    facts.push(structuredClone({ ...fact, sequence, ...(boundaryState ? { boundaryState } : {}) }));
  } catch (error) {
    lose("fact_append_failed");
    throw error;
  }
}
