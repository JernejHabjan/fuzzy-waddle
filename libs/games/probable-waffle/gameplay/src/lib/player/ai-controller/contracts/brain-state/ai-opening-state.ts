import type { AiSimulationTick } from "../ai-core-types";
import type { AiPlan } from "../ai-plan-contracts";

/** Opening state is separate so completed checkpoints survive defense and migration. */
export interface AiOpeningState {
  readonly archetypeId: string;
  readonly archetypeVersion: string;
  readonly selectedAtTick: AiSimulationTick;
  readonly plan: AiPlan;
}
