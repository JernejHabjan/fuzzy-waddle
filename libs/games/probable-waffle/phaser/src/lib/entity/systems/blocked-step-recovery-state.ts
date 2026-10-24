/** Mutable retry counters shared by recursive execution of one native path; never saved or relayed. */
export interface BlockedStepRecoveryState {
  /** Congestion waits already used at each blocked x/y tile within this path execution. */
  waitAttemptsByTile: Map<string, number>;
  /** Local sidesteps used across recursive recovery, capped by the path executor. */
  sideStepAttempts: number;
  /** Direct repath escalations used across recursive recovery; per-repath wait retries are separate. */
  repathAttempts: number;
}
