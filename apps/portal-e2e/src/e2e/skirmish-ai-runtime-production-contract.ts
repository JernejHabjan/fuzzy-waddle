/** Causal production proof requirements; counters and manager reason strings cannot satisfy these contracts. */
export interface RuntimeProductionContractV1 {
  readonly scenarioId: "PRO-03" | "PRO-06" | "PRO-07";
  /** Controls and sustained post-effect assertions run through this tick. */
  readonly latestTick: number;
  readonly stableForTicks: number;
  readonly branch:
    | "future_committed" | "future_abandoned"
    | "critical_exposed" | "safe_served" | "low_value" | "no_demand"
    | "shared_contention" | "cancel_pending_refund";
  /** Definition-backed producer and useful product selected by the causal fixture. */
  readonly producerObjectName: string;
  readonly productKey: string;
  /** Causal group identity; transition/resilience branches require same-seed pairs, queue branches are separate worlds. */
  readonly pairId: string;
}
