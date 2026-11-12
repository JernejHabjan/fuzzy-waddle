/**
 * Defines the structured pending correction contract for this module. Its declared surface makes emitter user
 * id, player number, first detected tick, last correction tick, correction attempts explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface PendingCorrection {
  /**
   * stable emitter user id used by {@link PendingCorrection} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  emitterUserId: string;
  /**
   * numeric player number carried by {@link PendingCorrection}. Its units and valid range are defined by {@link
   * PendingCorrection} and must remain consistent across producers and consumers.
   */
  playerNumber: number;
  /**
   * temporal value for {@link PendingCorrection}. It anchors ordering, expiry, or presentation timing and must
   * use the time domain declared by the enclosing contract.
   */
  firstDetectedTick: number;
  /**
   * temporal value for {@link PendingCorrection}. It anchors ordering, expiry, or presentation timing and must
   * use the time domain declared by the enclosing contract.
   */
  lastCorrectionTick: number;
  /**
   * numeric correction attempts carried by {@link PendingCorrection}. Its units and valid range are defined by
   * {@link PendingCorrection} and must remain consistent across producers and consumers.
   */
  correctionAttempts: number;
  /**
   * Optional string reason carried by {@link PendingCorrection}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  reason?: string;
}

