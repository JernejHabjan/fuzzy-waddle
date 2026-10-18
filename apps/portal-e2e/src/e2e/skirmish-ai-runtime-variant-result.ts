// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
// prettier-ignore
import type { AiRuntimePresetQueueApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-queue-application-v1";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

export interface RuntimeVariantResultV1 {
  /** Exact paused native application permits re-projecting raw world artifacts without inferred setup. */
  readonly productionPreset?: AiRuntimePresetApplicationV1;
  /** Absent until a real runtime adapter has retained ordered production/resource authority facts. */
  readonly productionEvidence?: RuntimeProductionEvidenceV1;
  /** Full authority channels keep setup, selected clocks and closed physical history separate from legacy diagnostics. */
  readonly productionEvidenceV2?: RuntimeProductionEvidenceV2;
  /** Raw authority diagnostics retain explicit gaps and cannot satisfy the independent evidence contract. */
  readonly productionCapture?: AiRuntimeProductionCaptureV1;
  /** Only explicitly bound cases retain the opponent's closed native history; never supplied to the AI. */
  readonly opponentCapture?: AiRuntimeProductionCaptureV1;
  /** Checked AI intent/authority lineage with unresolved gaps; never substitutes for full productionEvidence. */
  readonly productionCausality?: RuntimeProductionCausalityV1;
  /** Retained diagnostic failures when the duplicate normalized payload is omitted beside full raw/V2 authority. */
  readonly productionCausalityFailures?: readonly string[];
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
    readonly affectedActorId?: string | null;
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
