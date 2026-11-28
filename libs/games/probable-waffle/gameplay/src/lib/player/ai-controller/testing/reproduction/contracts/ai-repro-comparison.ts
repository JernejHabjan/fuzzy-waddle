import type { AiFirstDifference } from "../ai-first-difference";

/** First divergence plus an explicit changed-input label for DBG-04. */
export interface AiReproComparison {
  readonly classification: "same" | "changed_input" | "same_input_divergence";
  readonly firstDifference: AiFirstDifference | null;
}
