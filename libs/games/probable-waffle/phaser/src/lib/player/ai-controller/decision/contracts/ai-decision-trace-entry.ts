import type { AiDecisionReasonCode } from "./ai-decision-reason-code";
import type { AiDecisionOutcome } from "./ai-decision-outcome";

/** A bounded, presentation-safe record of one completed legacy AI decision. */
export interface AiDecisionTraceEntry {
  readonly traceId: string;
  readonly sequence: number;
  readonly action: string;
  readonly outcome: AiDecisionOutcome;
  readonly reason: AiDecisionReasonCode;
}
