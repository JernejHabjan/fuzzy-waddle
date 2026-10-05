import type { AiRuntimeProductionWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-world-v1";
import type { AiRuntimeProductionQueueV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-queue-v1";
import type { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Diagnostic owned world at one exact sampled boundary; null position/reachability never means safe or reachable. */
export interface RuntimeProductionWorldSnapshotV1 {
  readonly tick: number;
  /** Last captured player fact before sampling; null retains legacy ordering loss. */
  readonly afterSequence: number | null;
  /** Actual player tech authority at this sampled boundary, independent of completion callbacks. */
  readonly completedResearch: readonly ResearchType[];
  /** Source world omissions stay scoped to this sample; an incomplete index cannot establish product absence. */
  readonly gaps: readonly string[];
  readonly observationTick: number | null;
  readonly actors: AiRuntimeProductionWorldV1["actors"];
  /** Producer-scoped options preserve level changes over time; they are not a single global price table. */
  readonly catalog: AiRuntimeProductionWorldV1["catalog"];
  readonly producers: readonly {
    readonly actorId: string;
    readonly objectName: string;
    readonly ready: boolean;
    readonly currentLevel: number;
    readonly position: { readonly x: number; readonly y: number } | null;
    /** Pending full navigation authority cannot be filled by access-node membership or coordinate distance. */
    readonly reachable: null;
    readonly lanes: AiRuntimeProductionQueueV1["lanes"];
  }[];
}
