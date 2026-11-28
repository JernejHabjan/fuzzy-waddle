import type { AiBrainStepResult } from "../../../brain/ai-brain";
import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiCommandOutcome } from "../../../contracts/commands/ai-command-contracts";
import type { AiObservation } from "../../../contracts/observation/ai-observation";

/** Inline data payload stored beside an AiReproBundle manifest by test/developer tooling. */
export interface AiDecisionReproPayload {
  readonly observation: AiObservation;
  readonly priorState: AiBrainState;
  readonly outcomes: readonly AiCommandOutcome[];
  readonly expectedResult?: AiBrainStepResult;
}
