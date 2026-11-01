import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioFixture } from "../registration/native-scenario-registration.ts";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.ts";

test("D-03 preserves every difficulty/hidden mutation and the legitimate-contact control", () => {
  const fixture = nativeScenarioFixture("D-03"),
    contract = fixture.assertions["D-03"].requiredNativeScenario;
  assert.equal(fixture.recipe.variants.length, 30);
  for (const [mutation, mutate] of [
    ["position", (v) => (v.presetWorld.controls = [])],
    ["health", (v) => (v.presetWorld.events = [])],
    ["queue", (v) => (v.presetWorld.controls = [])],
    ["contact", (v) => (v.presetWorld.controls[0].action.worldPosition.x = 0)]
  ] as const) {
    const copy = structuredClone(fixture);
    const variant = copy.recipe.variants.find((v) => contract.branchByVariant[v.id] === `easy_${mutation}`);
    assert.ok(variant);
    mutate(variant);
    assert.equal(validNativeScenarioFixture(copy, "D-03"), false);
  }
});

test("D-01 binds each actual lobby policy in both factions and rejects a relabelled Normal fallback", () => {
  const fixture = nativeScenarioFixture("D-01"),
    contract = fixture.assertions["D-01"].requiredNativeScenario;
  assert.equal(fixture.recipe.variants.length, 6);
  for (const faction of ["Tivara", "Skaduwee"])
    for (const [branch, difficulty] of [
      ["easy", "Easy"],
      ["normal", "Normal"],
      ["hard", "Hard"]
    ] as const) {
      const variant = fixture.recipe.variants.find(
        (value) => value.aiFaction === faction && contract.branchByVariant[value.id] === branch
      );
      assert.ok(variant);
      assert.equal(variant.difficulty, difficulty);
      assert.equal(variant.presetWorld.resourceGrants.length, 0);
    }
  fixture.recipe.variants[0].difficulty = "Normal";
  assert.equal(validNativeScenarioFixture(fixture, "D-01"), false);
});

test("D-06 dispatch descriptors bind frozen legal starts without substituting generic preset worlds for calibration", () => {
  const fixture = nativeScenarioFixture("D-06");
  assert.equal(fixture.recipe.variants.length, 6);
  assert.equal(fixture.recipe.mapLabel, "River Crossing");
  assert.ok(
    fixture.capabilityLimits.some((entry) => /^Frozen workload specification sha256:[a-f0-9]{64}$/.test(entry))
  );
  for (const variant of fixture.recipe.variants) {
    assert.equal(variant.executionKind, "focused_natural");
    assert.equal(variant.presetWorld, undefined);
    assert.equal(variant.captureConstruction, undefined);
    assert.ok(variant.setupRationale.includes("frozen"));
  }
});

test("D-02 retains all selected policies and independent real multiplayer checkpoint transfer", () => {
  const fixture = nativeScenarioFixture("D-02"),
    branches = fixture.assertions["D-02"].requiredNativeScenario.branchByVariant;
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 18);
  for (const variant of fixture.recipe.variants) {
    const branch = branches[variant.id],
      pending = branch.endsWith("pending_plan");
    assert.equal(variant.checkpointTicks[0], pending ? 199 : { Easy: 39, Normal: 19, Hard: 9 }[variant.difficulty]);
    assert.equal(variant.captureCombat, undefined);
    assert.equal(variant.presetWorld.receiptFault?.holdHistory, pending ? true : undefined);
  }
  const withoutRealPeers = structuredClone(fixture);
  delete withoutRealPeers.recipe.requiresMultiplayer;
  assert.equal(validNativeScenarioFixture(withoutRealPeers, "D-02"), false);
});
