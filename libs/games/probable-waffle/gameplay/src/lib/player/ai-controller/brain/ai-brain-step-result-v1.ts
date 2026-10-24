import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiDebugSnapshotV1 } from "../contracts/ai-debug-snapshot-v1";
import type { AiIntentDecisionV1, AiIntentV1 } from "../contracts/ai-intent-v1";

/** Result of one pure decision boundary. */
export interface AiBrainStepResultV1 {
  readonly nextState: AiBrainStateV1;
  readonly acceptedIntents: readonly AiIntentV1[];
  readonly decisions: readonly AiIntentDecisionV1[];
  readonly trace: readonly AiIntentDecisionV1[];
  readonly debugSnapshot: AiDebugSnapshotV1;
}
