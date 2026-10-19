import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { nativeScenarioBindings, nativeScenarioFixture } from "./native-scenario-registration.mjs";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.mjs";

test("all thirty native bindings retain their full branches and original acceptance obligations", () => {
  const ids = Object.keys(nativeScenarioBindings.cases);
  assert.equal(ids.length, 30);
  const manifest = JSON.parse(readFileSync(new URL("./fixtures/skirmish-v1.json", import.meta.url)));
  for (const id of ids) {
    const row = manifest.rows.find((row) => row.id === id);
    assert.equal(row.fixture, `${id.toLowerCase()}-native-runtime.json`);
    assert.equal(row.runtimeRecipeDraft, undefined);
    const fixture = JSON.parse(readFileSync(new URL(`./fixtures/${row.fixture}`, import.meta.url)));
    assert.equal(validNativeScenarioFixture(fixture, id), true);
    assert.ok(fixture.acceptance.required.length > 0);
    assert.ok(fixture.acceptance.forbidden.length > 0);
    assert.equal(fixture.status, "authored_not_executed");
  }
});

test("native cases cannot downgrade to generic counts or omit a faction, branch or physical channel", () => {
  for (const id of Object.keys(nativeScenarioBindings.cases)) for (const mutate of [
    (value) => delete value.assertions[id].requiredNativeScenario,
    (value) => value.recipe.variants.pop(),
    (value) => value.recipe.variants[0].captureCombat = undefined,
    (value) => value.recipe.variants[0].captureConstruction = undefined,
    (value) => value.recipe.variants[0].evidenceStop = { earliestTick: 20, stableForTicks: 0 },
    (value) => value.recipe.variants[0].seed++,
    (value) => value.recipe.variants[0].presetWorld.resourceStarts[0].amounts.wood++,
    (value) => value.assertions[id].requiredNativeScenario.branchByVariant.invented = "quiet"
  ]) {
    const fixture = nativeScenarioFixture(id);
    mutate(fixture);
    assert.equal(validNativeScenarioFixture(fixture, id), false, id);
  }
});

test("source-controlled worlds reject erased perturbations, fake observations and altered topology", () => {
  for (const [id, branch, mutate] of [
    ["SCOUT-02", "hidden_health", (world) => world.events = []],
    ["SCOUT-02", "hidden_queue", (world) => world.controls = []],
    ["WALL-01", "terrain", (world) => world.terrainPatches = []],
    ["FIGHT-05", "stun", (world) => world.researchQueues = []],
    ["FIGHT-04", "healing", (world) => world.healthStarts = []],
    ["STRAT-10", "combined_loss", (world) => world.events = []],
    ["STRAT-07", "breach", (world) => world.events = []],
    ["H-28", "prefix", (world) => world.sourceStocks = []]
  ]) {
    const fixture = nativeScenarioFixture(id), binding = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((variant) => binding.branchByVariant[variant.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

test("capability-specific spell branches never invent the other faction's caster", () => {
  const fight = nativeScenarioFixture("FIGHT-05"), binding = fight.assertions["FIGHT-05"].requiredNativeScenario;
  for (const variant of fight.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    if (branch === "stun") assert.equal(variant.humanFaction, "Skaduwee");
    if (branch === "slow") assert.equal(variant.humanFaction, "Tivara");
  }
});
