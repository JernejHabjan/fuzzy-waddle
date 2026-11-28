import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { readNativeScenarioFixture } from "../read-native-scenario-fixture.ts";
import { nativeScenarioBindings, nativeScenarioFixture } from "../native-scenario-registration.ts";

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

test("positive native branches have usable proof checkpoints and a finite final deadline", () => {
  let checked = 0;
  for (const id of Object.keys(nativeScenarioBindings.cases)) {
    const { evidenceCheckpoints, evidenceCheckpointBranches, latestTick } = nativeScenarioBindings.cases[id];
    if (!evidenceCheckpoints) continue;
    const fixture = nativeScenarioFixture(id);
    const branches = fixture.assertions[id].requiredNativeScenario.branchByVariant;
    for (const variant of fixture.recipe.variants) {
      if (evidenceCheckpointBranches && !evidenceCheckpointBranches.includes(branches[variant.id])) continue;
      assert.equal(variant.executionKind, "focused_preset", variant.id);
      assert.notEqual(variant.role, "control", variant.id);
      assert.ok(!variant.requiresMultiplayer && !variant.additionalAiPlayers?.length, variant.id);
      assert.equal(variant.captureConstruction, true, variant.id);
      const ticks = variant.checkpointTicks ?? fixture.recipe.checkpointTicks;
      assert.equal(ticks.at(-1), latestTick, variant.id);
      assert.ok(Number.isSafeInteger(latestTick) && latestTick > 0, variant.id);
      assert.ok(
        evidenceCheckpoints.every((tick) => Number.isSafeInteger(tick) && tick < latestTick && ticks.includes(tick)),
        variant.id
      );
      const world = variant.presetWorld;
      const releaseTick = Math.max(
        0,
        ...(world.events ?? []).map(({ tick }) => tick),
        ...(world.controls ?? []).map(({ requestTick, applicationTick }) => Math.max(requestTick, applicationTick)),
        ...[...(world.routeOutages ?? []), world.brainFault, world.receiptFault].flatMap((fault) =>
          fault ? [fault.throughTick + 1] : []
        )
      );
      assert.ok(
        evidenceCheckpoints.some((tick) => tick >= releaseTick),
        variant.id
      );
      checked++;
    }
  }
  assert.ok(checked > 0);
});
