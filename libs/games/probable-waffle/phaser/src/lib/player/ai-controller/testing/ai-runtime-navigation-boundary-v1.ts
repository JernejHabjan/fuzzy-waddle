/** Capture-local boundary observations, never a native revision, cache age or complete topology history. */
export interface AiRuntimeNavigationBoundaryV1 {
  /**
   * Consecutive observed graph-reference epoch, starting at one. Null means no graph or observation loss.
   * Equal values only mean our boundary samples saw the same reference; intermediate unsampled changes remain unknown.
   */
  readonly graphObservationId: number | null;
  /** Number of observed update requests since observer installation. Requests can be throttled and are not rebuilds. */
  readonly updateRequestCount: number | null;
}
