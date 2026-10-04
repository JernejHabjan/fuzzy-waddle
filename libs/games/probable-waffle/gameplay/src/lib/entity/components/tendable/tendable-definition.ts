export type TendableDefinition = {
  /** Total milliseconds to reach 100% growth with no tenders assigned (when autoStart is true). */
  readonly growthDurationMs: number;
  /** Speed multiplier applied per assigned tender. */
  readonly tenderBoostMultiplier: number;
  /** Maximum number of tenders that can be assigned simultaneously. */
  readonly maxTenders: number;
  /**
   * When true, growth progresses automatically even without a tender.
   * When false (default), at least one tender must be assigned for growth to proceed.
   */
  readonly autoStart?: boolean;
};
