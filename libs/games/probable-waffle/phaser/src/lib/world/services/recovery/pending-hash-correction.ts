/** Tracks a remote player's divergence while repeated corrections are attempted. */
export interface PendingCorrection {
  /** Remote emitter receiving the correction. */
  emitterUserId: string;
  /** Player whose hash diverged. */
  playerNumber: number;
  /** Simulation tick anchoring the current divergence warning interval. */
  firstDetectedTick: number;
  /** Simulation tick of the most recent correction attempt. */
  lastCorrectionTick: number;
  /** Number of correction attempts since the divergence was detected. */
  correctionAttempts: number;
  /** Diagnostic reason associated with the divergence, when available. */
  reason?: string;
}
