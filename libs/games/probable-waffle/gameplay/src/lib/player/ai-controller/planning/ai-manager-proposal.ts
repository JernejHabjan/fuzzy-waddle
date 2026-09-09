import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type {
  AiBaseStateV1,
  AiEconomyProductionStateV1,
  AiFortificationStateV1,
  AiOpeningStateV1,
  AiSkirmishStateV1,
  AiStrategyStateV1,
  AiSquadStateV1,
  AiSupportStateV1,
  AiTransportStateV1
} from "../contracts/ai-brain-state-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
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
    /** Stage 14 replaces only its durable adaptation rationale after macro has projected the current ledger. */
    adaptation?: AiEconomyProductionStateV1["adaptation"];
    /** Stage 14 replaces only demand rows whose identity starts with `demand:adapt:`. */
    adaptationDemands?: readonly AiDemandV1[];
    /** Stage 12 owns durable causal recovery, retry and release facts. */
    recovery?: AiBrainStateV1["recovery"];
    transport?: AiBrainStateV1["transport"];
    /** Appended after the transport owner advances its lifecycle, preventing route-plan races. */
    transportAppend?: readonly AiTransportStateV1[];
    knowledge?: AiBrainStateV1["knowledge"];
    squads?: readonly AiSquadStateV1[];
    /** Narrow replacements merged by squad identity after Stage 9 mission ownership. */
    squadUpdates?: readonly AiSquadStateV1[];
    /** Stage 13 owns caster/healer windows and temporary-support accounting. */
    support?: readonly AiSupportStateV1[];
    strategy?: AiStrategyStateV1;
    skirmish?: AiSkirmishStateV1;
    /** Stage 10 is the only owner of stable base identity and expansion lifecycle. */
    bases?: readonly AiBaseStateV1[];
    /** Stage 11 is the sole owner of persistent fortification graphs. */
    fortifications?: readonly AiFortificationStateV1[];
  }>;
}

/** Read-only manager boundary; managers propose and never mutate the brain or runtime. */
export interface AiProposalManagerV1 {
  readonly managerId: string;
  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1;
}
