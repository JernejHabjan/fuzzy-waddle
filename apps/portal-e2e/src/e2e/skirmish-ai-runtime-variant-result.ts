import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";

export interface RuntimeVariantResultV1 {
  readonly variantId: string;
  readonly seed: number;
  readonly aiFaction: RuntimeVariantV1["aiFaction"];
  readonly initialOwnedActorCount: number;
  readonly initialWorkerCount: number;
  readonly checkpoints: readonly RuntimeCheckpointV1[];
  readonly perturbations: readonly { readonly id: string; readonly tick: number; readonly dispatchedActors: number }[];
  readonly aiErrors: readonly string[];
}
