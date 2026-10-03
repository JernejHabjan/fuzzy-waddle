import type { AiRuntimePresetQueueApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-queue-application-v1";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

export interface RuntimeVariantResultV1 {
  /** Absent until a real runtime adapter has retained ordered production/resource authority facts. */
  readonly productionEvidence?: RuntimeProductionEvidenceV1;
  /** Raw authority diagnostics retain explicit gaps and cannot satisfy the independent evidence contract. */
  readonly productionCapture?: AiRuntimeProductionCaptureV1;
  readonly variantId: string;
  readonly repetition?: number;
  readonly mapLabel: string;
  readonly stopReason: "terminal_result" | "evidence_satisfied" | "checkpoint_ceiling";
  readonly seed: number;
  readonly aiFaction: RuntimeVariantV1["aiFaction"];
  readonly initialOwnedActorCount: number;
  readonly initialWorkerCount: number;
  readonly presetFixtureId: string | null;
  readonly presetCreatedActorNames: readonly string[];
  readonly presetCreatedActorIds: Readonly<Record<string, string>>;
  readonly presetResourceGrantCount: number;
  readonly presetResourceStartCount: number;
  readonly presetInitialResourceBalances: Readonly<Record<number, Readonly<Record<string, number>>>>;
  readonly presetQueuedItemCount: number;
  readonly presetInitialQueueItems: readonly {
    readonly producerFixtureActorId: string;
    readonly producerActorId: string;
    readonly itemId: string;
    readonly kind: "production" | "research";
    readonly objectName: string | null;
    readonly researchType: string | null;
  }[];
  /** Detached real setup application records; absent in natural worlds and older synthetic oracle fixtures. */
  readonly presetQueueApplications?: readonly AiRuntimePresetQueueApplicationV1[];
  readonly presetInitialOrderCount: number;
  readonly determinismGroup: string | null;
  readonly supplyBranch?: "prebuild" | "ample_control";
  readonly pressureBranch?: "raid" | "safe_control";
  readonly resourceServiceBranch?: "build" | "served_control";
  readonly productionCapacityBranch?: "build" | "already_sufficient";
  /** Retained causal branch for the independent composition oracle and diagnostic replay. */
  readonly productionCompositionBranch?: "fill_deficit" | "satisfied_control" | "seeded_queue_control";
  readonly initialWorldDigest: string;
  readonly outcomeDigest: string;
  readonly checkpoints: readonly RuntimeCheckpointV1[];
  readonly perturbations: readonly {
    readonly id: string;
    readonly tick: number;
    readonly dispatchedActors: number;
    readonly subjectName: string | null;
  }[];
  readonly aiErrors: readonly string[];
  readonly timing?: {
    readonly setupMs: number;
    readonly perturbationMs: number;
    readonly totalWallMsExcludingTeardown: number;
    readonly checkpointPhases: readonly {
      readonly targetTick: number;
      readonly advanceMs: number;
      readonly settleMs: number;
      readonly captureMs: number;
    }[];
    readonly browserLongTasks: { readonly count: number; readonly totalMs: number; readonly maximumMs: number } | null;
  };
}
