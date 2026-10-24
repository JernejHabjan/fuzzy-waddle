/** Detached partial channel coverage. Neither contiguous ticks nor installed cohorts imply complete service/need history. */
export interface AiRuntimeResourceCoverageV1 {
  readonly captureEpoch: number;
  /** Monotone within the capture; a missing loss record cannot revive the epoch. */
  readonly lossEpoch: number;
  readonly startedTick: number;
  readonly frontier: { readonly tick: number; readonly captureSequence: number };
  readonly lost: boolean;
  readonly losses: readonly string[];
  /** Separate authority channels; successful native mutations cannot upgrade alias/lifecycle coverage. */
  readonly channels?: {
    readonly recipientNativeMutations: "partial";
    readonly selectedNeedLifecycle: "partial";
    readonly reconciledLiabilities: "partial";
    readonly cargoLifetime: "partial";
  };
  readonly cohorts: readonly {
    readonly cohortId: number;
    readonly actorId: string;
    readonly playerNumber: number;
    readonly installed: { readonly tick: number; readonly captureSequence: number };
    readonly channels: readonly ["cargo", "credit"];
  }[];
  /** Explicit unsupported authority; no caller may erase these because it saw successful deliveries. */
  readonly gaps: readonly string[];
}
