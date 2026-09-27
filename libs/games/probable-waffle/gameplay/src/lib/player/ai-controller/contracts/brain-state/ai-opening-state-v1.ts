import type { AiSimulationTick } from "../ai-core-types";
import type { AiPlanV1 } from "../ai-plan-contracts";

/** Opening state is separate so completed checkpoints survive defense and migration. */
export interface AiOpeningStateV1 {
  readonly archetypeId: string;
  readonly archetypeVersion: string;
  readonly selectedAtTick: AiSimulationTick;
  readonly plan: AiPlanV1;
}
