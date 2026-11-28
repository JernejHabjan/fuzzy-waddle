import type { AiSimulationTick } from "../ai-core-types";
import type { AiPlan } from "../planning/ai-plan-contracts";

/** Opening state is separate so completed checkpoints survive defense and migration. */
export interface AiOpeningState {
  readonly archetypeId: string;
  readonly archetypeVersion: string;
  /** Missing on older saves means the persisted choice has already been finalized. */
  readonly selectionStatus?: "pending_eligibility" | "resolved";
  readonly selectedAtTick: AiSimulationTick;
  readonly plan: AiPlan;
}
