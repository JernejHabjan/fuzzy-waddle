import type { AiRuntimeResourceServiceIntervalV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-resource-service-interval-v1";
import type { RuntimeResourceNeedV1 } from "./skirmish-ai-runtime-resource-need";

/** Observed interval quantities are diagnostics. Missing complete need history cannot become an actual usefulness verdict. */
export interface RuntimeResourceServiceIntervalV1 {
  readonly declaration: AiRuntimeResourceServiceIntervalV1;
  readonly need: RuntimeResourceNeedV1 | null;
  readonly observedIncome: number | null;
  /** Positive whole-pile income with one exact accepted selection; null when cohort/read/loss authority is unavailable. */
  readonly eligibleIncome: number | null;
  /** Upper bound on useful value of those observed credits, capped once by the selected aggregate need. */
  readonly potentialContribution: number | null;
  readonly usefulContribution: null;
  readonly retainedUsefulThroughput: null;
  readonly continuousUsefulCapacity: null;
  readonly windows: readonly {
    readonly startTick: number;
    readonly endTick: number;
    readonly minimumUsefulDelivery: number;
    readonly observedIncome: number | null;
    readonly eligibleIncome: number | null;
    readonly potentialContribution: number | null;
    readonly meetsUsefulFloor: null;
  }[];
  readonly gaps: readonly string[];
}
