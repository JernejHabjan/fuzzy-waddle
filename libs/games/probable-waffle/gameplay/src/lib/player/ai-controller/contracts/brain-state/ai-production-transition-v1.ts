import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDemandId, AiPlanId, AiSimulationTick } from "../ai-core-types";

/** Macro-owned optional future force commitment. Dates and identity survive saves without sliding on each decision. */
export interface AiProductionTransitionV1 {
  readonly planId: AiPlanId;
  readonly demandId: AiDemandId;
  readonly targetActorId: string;
  readonly domain: "ground" | "air";
  readonly producerObjectName: ObjectNames;
  readonly productObjectName: ObjectNames;
  readonly status: "committed" | "abandoned" | "fulfilled" | "expired";
  readonly committedTick: AiSimulationTick;
  /** Earliest unit admission; construction may proceed before this date. */
  readonly beginsTick: AiSimulationTick;
  readonly forceDeadlineTick: AiSimulationTick;
  readonly desiredForce: number;
  readonly desiredProducers: number;
  readonly unitDurationTicks: number;
  readonly reason: string;
}
