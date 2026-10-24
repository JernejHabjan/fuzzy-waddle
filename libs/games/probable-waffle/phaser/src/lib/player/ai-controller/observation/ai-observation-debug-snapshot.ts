import type { AiObservationInformationPolicy } from "./ai-observation-visibility-policy";

/** Read-only diagnostic projection; it never reaches back into the live world. */
export interface AiObservationDebugSnapshot {
  readonly policy: AiObservationInformationPolicy;
  readonly requestedGeneration: number;
  readonly committedGeneration: number;
  readonly committedTick: number | null;
  readonly observationAgeTicks: number | null;
  readonly visibleContactCount: number;
  readonly rememberedContactCount: number;
  readonly unknownFactCount: number;
  readonly queryInputRevision: number;
  readonly queryContinuationCursor: number;
  readonly invalidationDebt: number;
  readonly lastCommitError: string | null;
}
