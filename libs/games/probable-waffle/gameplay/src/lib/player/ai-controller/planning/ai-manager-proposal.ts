import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiServiceLaneV1 } from "../contracts/ai-lane-contracts";

/** Deterministic proposal batch produced by one narrow manager. */
export interface AiManagerProposalV1 {
  readonly managerId: string;
  readonly lane: AiServiceLaneV1;
  readonly evaluated: boolean;
  readonly intents: readonly AiIntentV1[];
  readonly reasons: readonly string[];
}

/** Read-only manager boundary; managers propose and never mutate the brain or runtime. */
export interface AiProposalManagerV1 {
  readonly managerId: string;
  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1;
}
