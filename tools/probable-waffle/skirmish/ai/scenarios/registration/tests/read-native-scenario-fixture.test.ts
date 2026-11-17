import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { readNativeScenarioFixture } from "../read-native-scenario-fixture.ts";

const fixtures = fileURLToPath(new URL("../../../testing/fixtures/", import.meta.url));

test("generated recipes retain their scenario identity and return independent worlds", () => {
  for (const [id, reference] of [
    [
      "PLACE-01",
      "native/placement/place-01-efficient-aligned-field-layout-in-safe-economic-space-valid-tending-deposit-runtime.json"
    ],
    ["FIGHT-01", "native/combat/fight-01-reassess-and-retreat-regroup-within-bound-runtime.json"],
    [
      "WALL-04",
      "native/fortification/wall-04-repair-rebuild-needed-nodes-and-reposition-defenders-or-abandon-invalid-perimeter-runtime.json"
    ]
  ]) {
    const first = readNativeScenarioFixture(fixtures, reference);
    const second = readNativeScenarioFixture(fixtures, reference);
    assert.deepEqual(first.scenarioIds, [id]);
    assert.deepEqual(first, second);
    first.recipe.variants[0].presetWorld.actors.length = 0;
    assert.notDeepEqual(first, second);
  }
});

test("unknown generated recipes fail closed", () => {
  const directory = mkdtempSync(join(tmpdir(), "ai-fixture-"));
  try {
    writeFileSync(join(directory, "unknown.json"), JSON.stringify({ generatedScenarioId: "UNKNOWN-01" }));
    assert.throws(() => readNativeScenarioFixture(directory, "unknown.json"), /unknown_generated_native_scenario/);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
