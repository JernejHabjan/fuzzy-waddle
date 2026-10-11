/** Scheduler cursors and RNG state are saved so pauses/reloads do not change choices. */
export interface AiSchedulerStateV1 {
  readonly decisionSequence: number;
  readonly accumulatorTicks: number;
  readonly catchUpLimit: 2;
  readonly continuationCursors: readonly { readonly owner: string; readonly cursor: number }[];
  readonly rngState: readonly number[];
}
