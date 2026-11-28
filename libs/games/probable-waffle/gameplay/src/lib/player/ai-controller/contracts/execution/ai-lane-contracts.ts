import type { AiSimulationTick } from "../ai-core-types";

/** Fair service lanes; urgency arbitration happens after every lane is considered. */
export type AiServiceLane =
  | "essential_economy"
  | "supply_production"
  | "scouting"
  | "army_threat"
  | "optional_infrastructure_tech";

/** Persisted deficit/age state for deterministic lane service. */
export interface AiLaneServiceState {
  readonly lane: AiServiceLane;
  readonly deficit: number;
  readonly lastConsideredTick: AiSimulationTick;
  readonly lastServicedTick: AiSimulationTick;
  readonly continuationCursor: number;
}
