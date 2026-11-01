import type { AiBrainState } from "../contracts/state/ai-state-contracts";
import type { AiDebugSnapshot } from "../contracts/diagnostics/ai-debug-snapshot";
import type { AiIntentDecision, AiIntent } from "../contracts/commands/ai-intent";

/** Result of one pure decision boundary. */
export interface AiBrainStepResult {
  readonly nextState: AiBrainState;
  readonly acceptedIntents: readonly AiIntent[];
  readonly decisions: readonly AiIntentDecision[];
  readonly trace: readonly AiIntentDecision[];
  readonly debugSnapshot: AiDebugSnapshot;
}
