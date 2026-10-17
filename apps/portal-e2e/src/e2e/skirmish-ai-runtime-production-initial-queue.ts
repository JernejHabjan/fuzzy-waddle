import type { AiRuntimeProductionQueueV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-queue-v1";
import type { AiRuntimePresetQueueApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-queue-application-v1";

/** Exact paused setup insertion and actual payment; per-tick insertion deliberately carries no paid-item credit. */
export interface RuntimeProductionInitialQueueV1 {
  readonly producerActorId: string;
  readonly laneId: string;
  readonly item: AiRuntimeProductionQueueV1["lanes"][number]["items"][number];
  readonly setupApplication: AiRuntimePresetQueueApplicationV1;
  readonly insertionSequences: readonly [number, number];
  readonly paymentSequence: number | null;
  readonly state: "paid_immediate" | "unpaid_per_tick";
}
