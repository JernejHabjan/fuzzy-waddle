import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { prepareRuntimeVariant } from "./skirmish-ai-runtime-variant-setup";
import { digestRuntimeValue, projectRuntimePresetQueueDigest } from "./skirmish-ai-runtime-digest";

/** Legacy operator/setup report labels stay separate from independently captured V2 actual-world equivalence. */
export function projectRuntimeVariantStart(
  variant: RuntimeVariantV1,
  initialBoundary: Awaited<ReturnType<typeof prepareRuntimeVariant>>,
  effectiveSeed: number,
  mapLabel: string
) {
  const initialWorldDigest = digestRuntimeValue({
    seed: effectiveSeed,
    actors: initialBoundary.state.ownedActorNames,
    authoredPreset: variant.presetWorld ?? null,
    preset: initialBoundary.presetApplication
      ? {
          fixtureId: initialBoundary.presetApplication.fixtureId,
          sourceRevision: initialBoundary.presetApplication.sourceRevision,
          fixtureDigest: initialBoundary.presetApplication.fixtureDigest,
          createdActorNames: initialBoundary.presetApplication.createdActorNames,
          resourceGrantCount: initialBoundary.presetApplication.resourceGrantCount,
          resourceStartCount: initialBoundary.presetApplication.resourceStartCount,
          queuedItemCount: initialBoundary.presetApplication.queuedItemCount,
          initialQueueItems: projectRuntimePresetQueueDigest(initialBoundary.presetApplication.initialQueueItems),
          initialOrderCount: initialBoundary.presetApplication.initialOrderCount
        }
      : null
  });
  return {
    ...(initialBoundary.presetApplication ? { productionPreset: initialBoundary.presetApplication } : {}),
    variantId: variant.id,
    mapLabel: variant.mapLabel ?? mapLabel,
    seed: effectiveSeed,
    aiFaction: variant.aiFaction,
    initialOwnedActorCount: initialBoundary.state.ownedActorCount,
    initialWorkerCount: initialBoundary.state.workerCount,
    presetFixtureId: initialBoundary.presetApplication?.fixtureId ?? null,
    presetCreatedActorNames: initialBoundary.presetApplication?.createdActorNames ?? [],
    presetCreatedActorIds: initialBoundary.presetApplication?.createdActorIds ?? {},
    presetResourceGrantCount: initialBoundary.presetApplication?.resourceGrantCount ?? 0,
    presetResourceStartCount: initialBoundary.presetApplication?.resourceStartCount ?? 0,
    presetInitialResourceBalances: initialBoundary.initialResourceBalances,
    presetQueuedItemCount: initialBoundary.presetApplication?.queuedItemCount ?? 0,
    presetInitialQueueItems: initialBoundary.presetApplication?.initialQueueItems ?? [],
    presetQueueApplications: initialBoundary.presetApplication?.queueApplications ?? [],
    presetInitialOrderCount: initialBoundary.presetApplication?.initialOrderCount ?? 0,
    determinismGroup: variant.determinismGroup ?? null,
    ...(variant.supplyBranch ? { supplyBranch: variant.supplyBranch } : {}),
    ...(variant.pressureBranch ? { pressureBranch: variant.pressureBranch } : {}),
    ...(variant.resourceServiceBranch ? { resourceServiceBranch: variant.resourceServiceBranch } : {}),
    ...(variant.productionCapacityBranch ? { productionCapacityBranch: variant.productionCapacityBranch } : {}),
    ...(variant.productionCompositionBranch
      ? { productionCompositionBranch: variant.productionCompositionBranch }
      : {}),
    initialWorldDigest
  };
}
