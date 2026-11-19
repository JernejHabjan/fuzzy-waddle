import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import type { RuntimeVariantResult } from "../../runner/skirmish-ai-runtime-variant-result";
import type { RuntimeVariant } from "../../setup/skirmish-ai-runtime-variant";
import { nativeScenarioBinding } from "./skirmish-ai-native-binding";

/** An authored prefix is available only for a local, fixed-step positive proof on the ordinary driver. */
export function nativeEvidenceCheckpoints(
  id: string,
  fixture: RuntimeFixture,
  variant: RuntimeVariant
): readonly number[] {
  const binding = nativeScenarioBinding(id);
  if (
    !binding ||
    !("evidenceCheckpoints" in binding) ||
    fixture.recipe.fixedStepFrames !== true ||
    fixture.recipe.requiresMultiplayer ||
    variant.requiresMultiplayer ||
    variant.additionalAiPlayers?.length ||
    variant.role === "control" ||
    variant.executionKind !== "focused_preset" ||
    variant.captureConstruction !== true ||
    variant.evidenceStop
  )
    return [];
  const branch = fixture.assertions[id]?.requiredNativeScenario?.branchByVariant[variant.id];
  if (
    "evidenceCheckpointBranches" in binding &&
    !binding.evidenceCheckpointBranches.some((candidate) => candidate === branch)
  )
    return [];
  return binding.evidenceCheckpoints;
}

/** A proof checkpoint has to follow the authored controls, including the release of deliberate faults. */
export function nativeEvidenceInterventionsPending(variant: RuntimeVariant, throughTick: number): boolean {
  const world = variant.presetWorld;
  const faults = [...(world?.routeOutages ?? []), world?.brainFault, world?.receiptFault];
  return (
    variant.perturbations?.some((event) => event.tick > throughTick) === true ||
    world?.events?.some((event) => event.tick > throughTick) === true ||
    world?.controls?.some((control) => Math.max(control.requestTick, control.applicationTick) > throughTick) === true ||
    faults.some((fault) => fault !== undefined && fault.throughTick >= throughTick)
  );
}

/** A prefix result must name a registered checkpoint and prove both independently sealed histories. */
export function nativeEvidenceWindow(
  id: string,
  result: RuntimeVariantResult,
  fixture: RuntimeFixture | undefined,
  variant: RuntimeVariant | undefined,
  ceiling: number
): readonly [throughTick: number, armedHorizon: number] | undefined {
  if (result.stopReason !== "native_evidence_satisfied" || !fixture || !variant) return undefined;
  const checkpoint = result.checkpoints.at(-1);
  if (
    !checkpoint ||
    checkpoint.tick !== checkpoint.targetTick ||
    checkpoint.tick >= ceiling ||
    !nativeEvidenceCheckpoints(id, fixture, variant).includes(checkpoint.tick) ||
    nativeEvidenceInterventionsPending(variant, checkpoint.tick)
  )
    return undefined;
  return [checkpoint.tick, ceiling];
}
