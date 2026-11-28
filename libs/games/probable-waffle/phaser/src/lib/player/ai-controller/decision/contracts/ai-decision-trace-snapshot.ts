import type { AiDecisionTraceEntry } from "./ai-decision-trace-entry";

/** Read-only snapshot consumed by the existing debug panel. */
export interface AiDecisionTraceSnapshot {
  readonly playerNumber: number;
  readonly eventLimit: number;
  readonly nextSequence: number;
  readonly events: readonly AiDecisionTraceEntry[];
}
