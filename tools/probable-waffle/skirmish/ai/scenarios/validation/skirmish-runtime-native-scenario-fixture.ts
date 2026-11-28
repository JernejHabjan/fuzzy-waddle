import { isDeepStrictEqual } from "node:util";
import { runtimeVariantInterventions } from "./skirmish-runtime-recipe-metadata.ts";
import { nativeScenarioBindings, nativeScenarioFixture } from "../registration/native-scenario-registration.ts";

/** A known native ID cannot downgrade to generic command counts, omit controls or silently change its branch premises. */
export function validNativeScenarioFixture(fixture, scenarioId) {
  if (!Object.hasOwn(nativeScenarioBindings.cases, scenarioId))
    return fixture.assertions?.[scenarioId]?.requiredNativeScenario === undefined;
  const expected = nativeScenarioFixture(scenarioId);
  const { evidenceCheckpoints, evidenceCheckpointBranches } = nativeScenarioBindings.cases[scenarioId];
  if (!validEvidenceCheckpoints(expected, scenarioId, evidenceCheckpoints, evidenceCheckpointBranches)) return false;
  return (
    fixture.schemaVersion === 1 &&
    fixture.driver === "runtime" &&
    fixture.evidenceKind === "runtime" &&
    isDeepStrictEqual(fixture.scenarioIds, [scenarioId]) &&
    isDeepStrictEqual(fixture.recipe, expected.recipe) &&
    isDeepStrictEqual(fixture.assertions, expected.assertions) &&
    isDeepStrictEqual(fixture.acceptance, expected.acceptance) &&
    isDeepStrictEqual(fixture.capabilityLimits, expected.capabilityLimits)
  );
}

/** Optional prefix candidates must be real non-terminal samples for the selected local branches. */
function validEvidenceCheckpoints(
  fixture: ReturnType<typeof nativeScenarioFixture>,
  scenarioId: string,
  checkpoints: unknown,
  branches: unknown
): boolean {
  if (checkpoints === undefined) return branches === undefined;
  const branchMap = fixture.assertions[scenarioId].requiredNativeScenario.branchByVariant;
  const knownBranches = new Set(Object.values(branchMap));
  if (
    branches !== undefined &&
    (!Array.isArray(branches) ||
      !branches.length ||
      new Set(branches).size !== branches.length ||
      branches.some((branch) => !knownBranches.has(branch)))
  )
    return false;
  if (
    !Array.isArray(checkpoints) ||
    !checkpoints.length ||
    checkpoints.some(
      (tick, index) =>
        !Number.isSafeInteger(tick) ||
        tick <= (checkpoints[index - 1] ?? 0) ||
        tick >= fixture.assertions[scenarioId].maximumTick
    ) ||
    fixture.recipe.fixedStepFrames !== true ||
    fixture.recipe.requiresMultiplayer
  )
    return false;
  return fixture.recipe.variants
    .filter((variant) => !Array.isArray(branches) || branches.includes(branchMap[variant.id]))
    .every((variant) => {
      const samples = variant.checkpointTicks ?? fixture.recipe.checkpointTicks;
      const finalProbe = checkpoints.at(-1);
      const world = variant.presetWorld;
      const faults = [...(world?.routeOutages ?? []), world?.brainFault, world?.receiptFault];
      return (
        variant.executionKind === "focused_preset" &&
        variant.role !== "control" &&
        !variant.requiresMultiplayer &&
        !variant.additionalAiPlayers?.length &&
        variant.captureConstruction === true &&
        checkpoints.every((tick) => samples.includes(tick)) &&
        runtimeVariantInterventions(variant).every((event) => event.tick <= finalProbe) &&
        faults.every((fault) => !fault || fault.throughTick < finalProbe)
      );
    });
}
