import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import type { prepareRuntimeVariant } from "./skirmish-ai-runtime-variant-setup";
import { evaluateRuntimeVariant } from "./skirmish-ai-runtime-variant-evaluation";
import { nextEvidenceStopState } from "./skirmish-ai-runtime-evidence-stop";

export function evaluateEvidenceStopAtCheckpoint(input: {
  readonly variant: RuntimeVariantV1;
  readonly fixture: RuntimeFixtureV1;
  readonly scenarioIds: readonly string[];
  readonly initialBoundary: Awaited<ReturnType<typeof prepareRuntimeVariant>>;
  readonly effectiveSeed: number;
  readonly checkpoints: readonly RuntimeCheckpointV1[];
  readonly perturbations: RuntimeVariantResultV1["perturbations"];
  readonly aiErrors: readonly string[];
  readonly pendingEventTicks: readonly number[];
  readonly satisfiedSinceTick: number | null;
}): { readonly satisfiedSinceTick: number | null; readonly stop: boolean } {
  const { variant, fixture, scenarioIds, initialBoundary, effectiveSeed, checkpoints,
    perturbations, aiErrors, pendingEventTicks, satisfiedSinceTick } = input;
  const state = initialBoundary.state;
  const preset = initialBoundary.presetApplication;
  const probe = {
    variantId: variant.id, mapLabel: variant.mapLabel ?? fixture.recipe.mapLabel,
    stopReason: "checkpoint_ceiling", seed: effectiveSeed, aiFaction: variant.aiFaction,
    initialOwnedActorCount: state.ownedActorCount, initialWorkerCount: state.workerCount,
    presetFixtureId: preset?.fixtureId ?? null, presetCreatedActorNames: preset?.createdActorNames ?? [],
    presetCreatedActorIds: preset?.createdActorIds ?? {}, presetResourceGrantCount: preset?.resourceGrantCount ?? 0,
    presetResourceStartCount: preset?.resourceStartCount ?? 0,
    presetInitialResourceBalances: initialBoundary.initialResourceBalances,
    presetQueuedItemCount: preset?.queuedItemCount ?? 0, presetInitialOrderCount: preset?.initialOrderCount ?? 0,
    determinismGroup: variant.determinismGroup ?? null, initialWorldDigest: "", outcomeDigest: "",
    checkpoints, perturbations, aiErrors
  } as RuntimeVariantResultV1;
  return nextEvidenceStopState({
    config: variant.evidenceStop, role: variant.role, assertions: scenarioIds.map((id) => fixture.assertions[id]),
    tick: checkpoints.at(-1)?.tick ?? -1, pendingEventTicks, satisfiedSinceTick,
    allPredicatesSatisfied: scenarioIds.every((id) =>
      evaluateRuntimeVariant(id, fixture.assertions[id], probe).length === 0)
  });
}
