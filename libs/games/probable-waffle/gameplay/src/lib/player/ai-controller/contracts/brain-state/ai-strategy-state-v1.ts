import type { AiDeadlineV1, AiEvidenceId, AiPlanId, AiSimulationTick } from "../ai-core-types";
import type { AiStrategyAssessment } from "../ai-strategy-assessment";

/** Persisted strategic stance with commitment hysteresis. */
export interface AiStrategyStateV1 {
  readonly stance: "opening" | "stabilize" | "defend" | "pressure" | "expand" | "recover" | "finish";
  readonly enteredTick: AiSimulationTick;
  readonly goalId: AiPlanId | null;
  readonly objectiveId: string | null;
  readonly commitmentDeadline: AiDeadlineV1;
  readonly evidenceIds: readonly AiEvidenceId[];
  readonly suspendedGoalId: AiPlanId | null;
  /** Optional for saves made before the strategic opportunity selector was introduced. */
  readonly assessment?: AiStrategyAssessment;
}
