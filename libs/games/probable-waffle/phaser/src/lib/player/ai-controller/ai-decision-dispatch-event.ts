import type { AiBrainState, AiIntentDecision, AiIntent } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiDecisionIdentity } from "./ai-decision-identity";
import type { AiDecisionInput } from "./ai-decision-input";
import type { AiGatheringSelection } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-gathering-selection";

export const AI_DECISION_DISPATCH_EVENT = "ai-decision-dispatch";

/**
 * Actual immutable planner result selected for dispatch, published before any command callback. The controller
 * saves nextState after dispatch returns; these reservations are selected-result facts, not reconciled live escrow.
 * Local diagnostics only, with no save/wire schema or gameplay authority.
 */
export interface AiDecisionDispatchEvent {
  readonly identity: AiDecisionIdentity;
  /** Absent only on older/synthetic publishers; exact consumed input is never borrowed from a later checkpoint. */
  readonly input?: AiDecisionInput;
  /** Selected save-owned policy identity, independently compared with the controller's consumed configuration. */
  readonly persistedProfile?: Pick<AiBrainState, "profileVersion" | "profileDifficulty">;
  /** Actual consumed proposal inputs, only for accepted original intents; legacy omission is unavailable. */
  readonly gatheringSelections?: readonly AiGatheringSelection[];
  readonly acceptedIntents: readonly AiIntent[];
  readonly decisions: readonly AiIntentDecision[];
  readonly reservations: AiBrainState["reservations"];
  readonly economyProduction: AiBrainState["economyProduction"];
  /** Exact selected strategy, including assessed force demand. Legacy omission cannot certify control branches. */
  readonly strategy?: AiBrainState["strategy"];
  /** Selected opening checkpoints distinguish genuine post-opening controls from temporary startup suppression. */
  readonly opening?: AiBrainState["opening"];
  /** Selected ownership and knowledge, not proof of physical travel, firing or protection. Null means bounded loss. */
  readonly missionState?: Pick<AiBrainState, "squads" | "knowledge" | "skirmish" | "bases" |
    "fortifications" | "support" | "progress" | "recoveryEpisodes" | "recovery" | "blockers" | "transport" |
    "authority" | "pendingOutcomes" | "waitEdges" | "lanes" | "scheduler" | "queries"> | null;
}
