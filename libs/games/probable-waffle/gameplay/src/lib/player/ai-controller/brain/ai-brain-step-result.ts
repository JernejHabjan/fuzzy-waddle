import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiDebugSnapshot } from "../contracts/ai-debug-snapshot";
import type { AiIntentDecision, AiIntent } from "../contracts/ai-intent";

/** Result of one pure decision boundary. */
export interface AiBrainStepResult {
  readonly nextState: AiBrainState;
  readonly acceptedIntents: readonly AiIntent[];
  readonly decisions: readonly AiIntentDecision[];
  readonly trace: readonly AiIntentDecision[];
  readonly debugSnapshot: AiDebugSnapshot;
}
