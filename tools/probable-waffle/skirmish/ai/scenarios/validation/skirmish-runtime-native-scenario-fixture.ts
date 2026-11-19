import { isDeepStrictEqual } from "node:util";
import { nativeScenarioBindings, nativeScenarioFixture } from "../registration/native-scenario-registration.ts";

/** A known native ID cannot downgrade to generic command counts, omit controls or silently change its branch premises. */
export function validNativeScenarioFixture(fixture, scenarioId) {
  if (!Object.hasOwn(nativeScenarioBindings.cases, scenarioId))
    return fixture.assertions?.[scenarioId]?.requiredNativeScenario === undefined;
  const expected = nativeScenarioFixture(scenarioId);
  const evidenceCheckpoints = nativeScenarioBindings.cases[scenarioId].evidenceCheckpoints;
  if (evidenceCheckpoints !== undefined && !validEvidenceCheckpoints(expected, scenarioId, evidenceCheckpoints))
    return false;
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

/** Optional prefix candidates must be real, non-terminal sample ticks for every paired local setup. */
function validEvidenceCheckpoints(
  fixture: ReturnType<typeof nativeScenarioFixture>,
  scenarioId: string,
  checkpoints: unknown
): boolean {
  if (
    !Array.isArray(checkpoints) ||
    !checkpoints.length ||
    new Set(checkpoints).size !== checkpoints.length ||
    fixture.recipe.fixedStepFrames !== true ||
    fixture.recipe.requiresMultiplayer
  )
    return false;
  return fixture.recipe.variants.every((variant) =>
    variant.executionKind === "focused_preset" &&
    !variant.requiresMultiplayer &&
    !variant.additionalAiPlayers?.length &&
    variant.captureConstruction === true &&
    checkpoints.every((tick) =>
      Number.isSafeInteger(tick) &&
      tick > 0 &&
      tick < fixture.assertions[scenarioId].maximumTick &&
      (variant.checkpointTicks ?? fixture.recipe.checkpointTicks).includes(tick)
    )
  );
}
