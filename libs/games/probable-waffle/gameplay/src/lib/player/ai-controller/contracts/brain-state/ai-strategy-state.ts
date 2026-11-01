import type { AiDeadline, AiEvidenceId, AiPlanId, AiSimulationTick } from "../ai-core-types";
import type { AiStrategyAssessment } from "../ai-strategy-assessment";

/** Persisted strategic stance with commitment hysteresis. */
export interface AiStrategyState {
  readonly stance: "opening" | "stabilize" | "defend" | "pressure" | "expand" | "recover" | "finish";
  readonly enteredTick: AiSimulationTick;
  readonly goalId: AiPlanId | null;
  readonly objectiveId: string | null;
  readonly commitmentDeadline: AiDeadline;
  readonly evidenceIds: readonly AiEvidenceId[];
  readonly suspendedGoalId: AiPlanId | null;
  /** Optional for saves made before the strategic opportunity selector was introduced. */
  readonly assessment?: AiStrategyAssessment;
}
