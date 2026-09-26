import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";

export interface RuntimeVariantResultV1 {
  readonly variantId: string;
  readonly seed: number;
  readonly aiFaction: RuntimeVariantV1["aiFaction"];
  readonly initialOwnedActorCount: number;
  readonly initialWorkerCount: number;
  readonly presetFixtureId: string | null;
  readonly presetCreatedActorNames: readonly string[];
  readonly presetResourceGrantCount: number;
  readonly presetQueuedItemCount: number;
  readonly determinismGroup: string | null;
  readonly supplyBranch?: "prebuild" | "ample_control";
  readonly resourceServiceBranch?: "build" | "served_control";
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
