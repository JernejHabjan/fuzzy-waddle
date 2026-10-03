import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiBrainStepResultV1 } from "./ai-brain-step-result-v1";

/** Pure brain boundary used by the host runtime adapter. */
export interface AiBrainV1 {
  step(
    observation: AiObservationV1,
    previousState: AiBrainStateV1,
    orderedOutcomes: readonly AiCommandOutcomeV1[]
  ): AiBrainStepResultV1;
}
