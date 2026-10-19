import { isDeepStrictEqual } from "node:util";
import { nativeScenarioBindings, nativeScenarioFixture } from "./native-scenario-registration.mjs";

/** A known native ID cannot downgrade to generic command counts, omit controls or silently change its branch premises. */
export function validNativeScenarioFixture(fixture, scenarioId) {
  if (!Object.hasOwn(nativeScenarioBindings.cases, scenarioId))
    return fixture.assertions?.[scenarioId]?.requiredNativeScenario === undefined;
  const expected = nativeScenarioFixture(scenarioId);
  return fixture.schemaVersion === 1 && fixture.driver === "runtime" && fixture.evidenceKind === "runtime" &&
    isDeepStrictEqual(fixture.scenarioIds, [scenarioId]) && isDeepStrictEqual(fixture.recipe, expected.recipe) &&
    isDeepStrictEqual(fixture.assertions, expected.assertions) && isDeepStrictEqual(fixture.acceptance, expected.acceptance);
}
