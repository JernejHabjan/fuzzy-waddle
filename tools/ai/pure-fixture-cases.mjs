const testRoots = ["libs/games/probable-waffle/gameplay/src/lib/", "libs/games/probable-waffle/phaser/src/lib/"];

/** Optional exact bindings reuse semantic controls without renaming tests or inferring coverage from file names. */
export function readPureFixtureCase(fixture, scenarioId) {
  if (fixture.pureCases === undefined) return null;
  const nonempty = (value) => typeof value === "string" && value.trim().length > 0;
  if (
    !Array.isArray(fixture.pureCases) ||
    fixture.pureCases.length === 0 ||
    !Array.isArray(fixture.scenarioIds) ||
    fixture.pureCases.length !== fixture.scenarioIds.length ||
    new Set(fixture.scenarioIds).size !== fixture.scenarioIds.length ||
    new Set(fixture.pureCases.map((entry) => entry?.scenarioId)).size !== fixture.pureCases.length
  ) {
    throw new Error("invalid_pure_fixture_cases");
  }
  for (const entry of fixture.pureCases) {
    if (
      !entry ||
      !fixture.scenarioIds?.includes(entry.scenarioId) ||
      !["owner_contract", "scenario_contract"].includes(entry.coverage) ||
      !nonempty(entry.setup) ||
      !nonempty(entry.expected) ||
      !Array.isArray(entry.remaining) ||
      entry.remaining.some((value) => !nonempty(value)) ||
      (entry.coverage === "owner_contract" && entry.remaining.length === 0) ||
      (entry.coverage === "scenario_contract" && entry.remaining.length !== 0) ||
      !Array.isArray(entry.tests) ||
      entry.tests.length === 0 ||
      new Set(entry.tests.map((test) => `${test?.file}\0${test?.title}`)).size !== entry.tests.length ||
      entry.tests.some(
        (test) =>
          !test ||
          !nonempty(test.title) ||
          test.title.length > 500 ||
          typeof test.file !== "string" ||
          !testRoots.some((root) => test.file.startsWith(root)) ||
          !test.file.endsWith(".spec.ts") ||
          test.file.includes("..") ||
          test.file.includes("\\") ||
          !/^[a-zA-Z0-9_./-]+$/.test(test.file)
      )
    ) {
      throw new Error(`invalid_pure_fixture_case:${entry?.scenarioId ?? "missing"}`);
    }
  }
  const selected = fixture.pureCases.find((entry) => entry.scenarioId === scenarioId);
  if (!selected) throw new Error(`missing_pure_fixture_case:${scenarioId}`);
  return selected;
}
