// prettier-ignore
import type { AiRuntimePresetApplication } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/presets/setup/ai-runtime-preset-application";
// prettier-ignore
import type { AiRuntimePresetQueueApplication } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/presets/setup/ai-runtime-preset-queue-application";
import type { RuntimeCheckpoint } from "../capture/skirmish-ai-runtime-checkpoint";
import type { RuntimeVariant } from "../setup/skirmish-ai-runtime-variant";
import type { RuntimeProductionEvidence } from "../production/evidence/skirmish-ai-runtime-production-evidence";
import type { RuntimeProductionCausality } from "../production/decisions/skirmish-ai-runtime-production-causality";
import type { RuntimeNativeProductionEvidence } from "../production/evidence/skirmish-ai-runtime-native-production-evidence";
import type { NativeDisposalEvidence } from "../lifecycle/cleanup/skirmish-ai-native-disposal-evidence";
import type { NativeDebugComparisonProof } from "../debug/skirmish-ai-native-debug-comparison-proof";
import type { NativeDebugParityProof } from "../debug/skirmish-ai-native-debug-parity-proof";
import type { NativeLifecycleProof } from "../lifecycle/matches/skirmish-ai-native-lifecycle-proof";
import type { NativeImportProof } from "../reproduction/import/skirmish-ai-native-import-proof";
import type { NativeSaveProof } from "../reproduction/save/skirmish-ai-native-save-proof";
import type { runNativeProfileTransfer } from "../lifecycle/transfer/skirmish-ai-native-profile-transfer";
import type { cancelNativeOriginalProduction } from "../production/cancellation/skirmish-ai-native-cancel-original-production";
import type { NativeRetentionProof } from "../reproduction/save/skirmish-ai-native-retention-proof";
import type { NativeSequenceProof } from "./skirmish-ai-native-sequence-runner";
import type { NativeReproProof } from "../reproduction/incident/skirmish-ai-native-repro-runner";
import type { exerciseNativeLiveWorkbench } from "../debug/skirmish-ai-native-live-workbench";
// prettier-ignore
import type { AiRuntimeProductionSnapshot } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-snapshot";

export interface RuntimeVariantResult {
  readonly nativeSave?: NativeSaveProof;
  readonly nativeProfileTransfer?: Awaited<ReturnType<typeof runNativeProfileTransfer>>;
  readonly nativeCancellation?: Awaited<ReturnType<typeof cancelNativeOriginalProduction>>;
  readonly nativeRetention?: NativeRetentionProof;
  readonly nativeSequence?: NativeSequenceProof;
  readonly nativeRepro?: NativeReproProof;
  readonly nativeLiveWorkbench?: Awaited<ReturnType<typeof exerciseNativeLiveWorkbench>>;
  readonly nativeLifecycle?: NativeLifecycleProof;
  readonly nativeImport?: NativeImportProof;
  /** Explicit H-20 shutdown branch, captured after sealed history and before closing the browser context. */
  readonly nativeDisposal?: NativeDisposalEvidence;
  /** Actual native selected input, isolated pure replay, first-field comparison and untouched native world. */
  readonly nativeDebugComparison?: NativeDebugComparisonProof;
  readonly nativeDebugParity?: NativeDebugParityProof;
  /** Exact paused native application permits re-projecting raw world artifacts without inferred setup. */
  readonly productionPreset?: AiRuntimePresetApplication;
  /** Absent until a real runtime adapter has retained ordered production/resource authority facts. */
  readonly productionEvidence?: RuntimeProductionEvidence;
  /** Full authority channels keep setup, selected clocks and closed physical history separate from legacy diagnostics. */
  readonly productionEvidenceV2?: RuntimeNativeProductionEvidence;
  /** Raw authority diagnostics retain explicit gaps and cannot satisfy the independent evidence contract. */
  readonly productionCapture?: AiRuntimeProductionSnapshot;
  /** Only explicitly bound cases retain the opponent's closed native history; never supplied to the AI. */
  readonly opponentCapture?: AiRuntimeProductionSnapshot;
  /** Extra real lobby opponents share the same observer, clock and fact budget. */
  readonly otherOpponentCaptures?: readonly AiRuntimeProductionSnapshot[];
  /** Checked AI intent/authority lineage with unresolved gaps; never substitutes for full productionEvidence. */
  readonly productionCausality?: RuntimeProductionCausality;
  /** Retained diagnostic failures when the duplicate normalized payload is omitted beside full raw/V2 authority. */
  readonly productionCausalityFailures?: readonly string[];
  readonly variantId: string;
  readonly repetition?: number;
  readonly mapLabel: string;
  readonly stopReason: "terminal_result" | "evidence_satisfied" | "checkpoint_ceiling";
  readonly seed: number;
  readonly aiFaction: RuntimeVariant["aiFaction"];
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
  readonly presetQueueApplications?: readonly AiRuntimePresetQueueApplication[];
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
  readonly checkpoints: readonly RuntimeCheckpoint[];
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
