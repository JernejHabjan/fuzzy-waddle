import type { AiEvidenceId, AiQuestionId, AiSimulationTick } from "../ai-core-types";

/** Permitted durable knowledge with stable evidence/question identities. */
export interface AiKnowledgeStateV1 {
  readonly revision: number;
  readonly evidence: readonly {
    readonly evidenceId: AiEvidenceId;
    readonly sourceId: string;
    readonly observedTick: AiSimulationTick;
    readonly confidencePermille: number;
  }[];
  readonly questions: readonly {
    readonly questionId: AiQuestionId;
    readonly kind: string;
    readonly createdTick: AiSimulationTick;
    readonly state: "open" | "answered" | "obsolete" | "too_costly";
  }[];
}
