import type { AiBrainStateV1, AiIntentDecisionV1, AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiDecisionIdentity } from "./ai-decision-identity";
import type { AiDecisionInputV1 } from "./ai-decision-input-v1";
import type { AiGatheringSelection } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-gathering-selection";

export const AI_DECISION_DISPATCH_EVENT = "ai-decision-dispatch";

/**
 * Actual immutable planner result selected for dispatch, published before any command callback. The controller
 * saves nextState after dispatch returns; these reservations are selected-result facts, not reconciled live escrow.
 * Local diagnostics only, with no save/wire schema or gameplay authority.
 */
export interface AiDecisionDispatchEvent {
  readonly identity: AiDecisionIdentity;
  /** Absent only on older/synthetic publishers; exact consumed input is never borrowed from a later checkpoint. */
  readonly input?: AiDecisionInputV1;
  /** Actual consumed proposal inputs, only for accepted original intents; legacy omission is unavailable. */
  readonly gatheringSelections?: readonly AiGatheringSelection[];
  readonly acceptedIntents: readonly AiIntentV1[];
  readonly decisions: readonly AiIntentDecisionV1[];
  readonly reservations: AiBrainStateV1["reservations"];
  readonly economyProduction: AiBrainStateV1["economyProduction"];
}
