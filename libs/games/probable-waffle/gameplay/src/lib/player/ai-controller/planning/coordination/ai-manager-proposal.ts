export type { AiProposalManager } from "./contracts/ai-proposal-manager";
import type { AiIntent } from "../../contracts/commands/ai-intent";
import type {
  AiBaseState,
  AiBrainState,
  AiEconomyProductionState,
  AiFortificationState,
  AiOpeningState,
  AiSkirmishState,
  AiSquadState,
  AiStrategyState,
  AiSupportState,
  AiTransportState
} from "../../contracts/state/ai-state-contracts";
import type { AiDemand } from "../../contracts/planning/ai-plan-contracts";
import type { AiServiceLane } from "../../contracts/execution/ai-lane-contracts";
import type { AiReservation } from "../../contracts/execution/ai-dependency-contracts";
import type { AiPlanId } from "../../contracts/ai-core-types";

/** Deterministic proposal batch produced by one narrow manager. */
export interface AiManagerProposal {
  readonly managerId: string;
  readonly lane: AiServiceLane;
  /** Additional lanes this manager actually evaluated in the same deterministic proposal pass. */
  readonly evaluatedLanes?: readonly AiServiceLane[];
  readonly evaluated: boolean;
  readonly intents: readonly AiIntent[];
  readonly reasons: readonly string[];
  /** The macro owner publishes the current posture to shared resource arbitration. */
  readonly spendingBudget?: Readonly<{ economyPermille: number; defensePermille: number }>;
  /**
   * Optional deterministic state projection owned by a narrow proposer.  It is
   * committed at the same decision boundary as accepted intents, so demand and
   * opening identity survive a save/reload instead of being recomputed as a
   * fresh request on every cadence.
   */
  readonly statePatch?: Readonly<{
    /** Macro may append optional forecasts; they neither reserve cash nor prove command application. */
    forecastReservations?: readonly AiReservation[];
    /** Release only forecast/provisional claims. Dispatched, paid and refundable work remains authoritative. */
    releasedOptionalPlanIds?: readonly AiPlanId[];
    opening?: AiOpeningState;
    /** Adaptation may change only the opening archetype; macro remains the plan/progress owner. */
    openingArchetypeId?: AiOpeningState["archetypeId"];
    economyProduction?: AiEconomyProductionState;
    /** Adaptation replaces only its durable adaptation rationale after macro has projected the current ledger. */
    adaptation?: AiEconomyProductionState["adaptation"];
    /** Adaptation replaces only demand rows whose identity starts with `demand:adapt:`. */
    adaptationDemands?: readonly AiDemand[];
    /** Recovery owns durable causal recovery, retry and release facts. */
    recovery?: AiBrainState["recovery"];
    transport?: AiBrainState["transport"];
    /** Appended after the transport owner advances its lifecycle, preventing route-plan races. */
    transportAppend?: readonly AiTransportState[];
    knowledge?: AiBrainState["knowledge"];
    squads?: readonly AiSquadState[];
    /** Narrow replacements merged by squad identity after skirmish mission ownership. */
    squadUpdates?: readonly AiSquadState[];
    /** Tactics owns caster/healer windows and temporary-support accounting. */
    support?: readonly AiSupportState[];
    strategy?: AiStrategyState;
    skirmish?: AiSkirmishState;
    /** Expansion is the only owner of stable base identity and expansion lifecycle. */
    bases?: readonly AiBaseState[];
    /** Fortification is the sole owner of persistent fortification graphs. */
    fortifications?: readonly AiFortificationState[];
  }>;
}
