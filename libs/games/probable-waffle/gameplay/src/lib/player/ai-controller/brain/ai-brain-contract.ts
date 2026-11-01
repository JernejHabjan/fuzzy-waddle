import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiCommandOutcome } from "../contracts/ai-command-contracts";
import type { AiObservation } from "../contracts/ai-observation";
import type { AiBrainStepResult } from "./ai-brain-step-result";

/** Pure brain boundary used by the host runtime adapter. */
export interface AiBrain {
  step(
    observation: AiObservation,
    previousState: AiBrainState,
    orderedOutcomes: readonly AiCommandOutcome[]
  ): AiBrainStepResult;
}
