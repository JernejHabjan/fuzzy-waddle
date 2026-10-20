import type { AiBoundaryFault } from "../ai-boundary-fault";

/** Scheduler cursors and RNG state are saved so pauses/reloads do not change choices. */
export interface AiSchedulerStateV1 {
  readonly decisionSequence: number;
  readonly accumulatorTicks: number;
  readonly catchUpLimit: 2;
  readonly continuationCursors: readonly { readonly owner: string; readonly cursor: number }[];
  readonly rngState: readonly number[];
  /** At most 32 proposer/debug incidents. Absent on older saves; never used to hide mandatory authority failure. */
  readonly boundaryFaults?: readonly AiBoundaryFault[];
}
