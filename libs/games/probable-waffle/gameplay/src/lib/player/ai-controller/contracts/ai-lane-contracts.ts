import type { AiSimulationTick } from "./ai-core-types";

/** Fair service lanes; urgency arbitration happens after every lane is considered. */
export type AiServiceLaneV1 =
  | "essential_economy"
  | "supply_production"
  | "scouting"
  | "army_threat"
  | "optional_infrastructure_tech";

/** Persisted deficit/age state for deterministic lane service. */
export interface AiLaneServiceStateV1 {
  readonly lane: AiServiceLaneV1;
  readonly deficit: number;
  readonly lastConsideredTick: AiSimulationTick;
  readonly lastServicedTick: AiSimulationTick;
  readonly continuationCursor: number;
}
