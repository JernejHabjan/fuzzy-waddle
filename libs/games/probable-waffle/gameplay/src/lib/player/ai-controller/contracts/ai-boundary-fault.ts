/** Bounded, saved optional-boundary incident. Absolute retry ticks survive reload; mandatory failures never enter this list. */
export interface AiBoundaryFault {
  /** Stable proposer identity, or debug_projection; records are canonicalized by this key. */
  readonly owner: string;
  /** Saturating failure count controls deterministic backoff, independently of frame rate. */
  readonly failures: number;
  readonly lastFailureTick: number;
  readonly retryAtTick: number;
  readonly reason: string;
  /** Null until the same real boundary succeeds again; recovery does not erase the incident. */
  readonly recoveredTick: number | null;
}
