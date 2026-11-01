import type { AiRuntimeProductionQueue } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/queues/ai-runtime-production-queue";
import type { AiRuntimePresetQueueApplication } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/presets/setup/ai-runtime-preset-queue-application";

/** Exact paused setup insertion and actual payment; per-tick insertion deliberately carries no paid-item credit. */
export interface RuntimeProductionInitialQueue {
  readonly producerActorId: string;
  readonly laneId: string;
  readonly item: AiRuntimeProductionQueue["lanes"][number]["items"][number];
  readonly setupApplication: AiRuntimePresetQueueApplication;
  readonly insertionSequences: readonly [number, number];
  readonly paymentSequence: number | null;
  readonly state: "paid_immediate" | "unpaid_per_tick";
}
