/** Correlation supplied by the pure AI while sequence/epoch authority remains bus-owned. */
export interface AiGameCommandCorrelation {
  readonly intentId: string;
  readonly effectId: string;
  readonly commitmentKey: string;
}
