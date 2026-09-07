import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiEconomyProductionStateV1, AiOpeningStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiServiceLaneV1 } from "../contracts/ai-lane-contracts";

/** Deterministic proposal batch produced by one narrow manager. */
export interface AiManagerProposalV1 {
  readonly managerId: string;
  readonly lane: AiServiceLaneV1;
  readonly evaluated: boolean;
  readonly intents: readonly AiIntentV1[];
  readonly reasons: readonly string[];
  /**
   * Optional deterministic state projection owned by a narrow proposer.  It is
   * committed at the same decision boundary as accepted intents, so demand and
   * opening identity survive a save/reload instead of being recomputed as a
   * fresh request on every cadence.
   */
  readonly statePatch?: Readonly<{
    opening?: AiOpeningStateV1;
    economyProduction?: AiEconomyProductionStateV1;
    transport?: AiBrainStateV1["transport"];
  }>;
}

/** Read-only manager boundary; managers propose and never mutate the brain or runtime. */
export interface AiProposalManagerV1 {
  readonly managerId: string;
  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1;
}
