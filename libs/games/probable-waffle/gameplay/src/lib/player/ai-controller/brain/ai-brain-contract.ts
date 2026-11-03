import type { AiBrainState } from "../contracts/state/ai-state-contracts";
import type { AiCommandOutcome } from "../contracts/commands/ai-command-contracts";
import type { AiObservation } from "../contracts/observation/ai-observation";
import type { AiBrainStepResult } from "./ai-brain-step-result";

/** Pure brain boundary used by the host runtime adapter. */
export interface AiBrain {
  step(
    observation: AiObservation,
    previousState: AiBrainState,
    orderedOutcomes: readonly AiCommandOutcome[]
  ): AiBrainStepResult;
}
