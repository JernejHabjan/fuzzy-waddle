import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validExpansionPressureRecipe } from "./skirmish-runtime-expansion-pressure-fixture.mjs";
import { validateManifest } from "./skirmish-matrix-fixtures.mjs";
import { fileURLToPath } from "node:url";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/expansion-pressure-runtime.json", import.meta.url)));
const valid = (value) => validExpansionPressureRecipe(value.recipe, value.assertions["EXP-02"], "EXP-02");

test("EXP-02 registers eight paired native branches and keeps every declared branch bound", () => {
  assert.equal(valid(fixture), true);
  const manifest = JSON.parse(readFileSync(new URL("./fixtures/skirmish-v1.json", import.meta.url)));
  const row = manifest.rows.find((entry) => entry.id === "EXP-02");
  assert.equal(row.fixture, "expansion-pressure-runtime.json");
  assert.equal(row.runtimeRecipeDraft, undefined);
  validateManifest(manifest, fileURLToPath(new URL("./fixtures/", import.meta.url)));
});

test("a missing faction/branch, arbitrary map/seed or altered budget cannot impersonate a pressure pair", () => {
  for (const damage of [
    (value) => value.recipe.variants.pop(),
    (value) => value.recipe.variants[1].seed++,
    (value) => value.recipe.variants[1].mapLabel = "nonexistent fortified map",
    (value) => value.recipe.variants[1].presetWorld.resourceStarts[0].amounts.wood++,
    (value) => value.recipe.variants[1].presetWorld.actors.push({ fixtureActorId: "extra-worker", owner: 2 }),
    (value) => value.recipe.variants[1].captureCombat = undefined,
    (value) => value.assertions["EXP-02"].requiredExpansionPressure.branchByVariant.invented = "expand"
  ]) {
    const changed = structuredClone(fixture);
    damage(changed);
    assert.equal(valid(changed), false);
  }
});

test("combat recovery cannot use withdrawal, scripted kills, pre-completed work or changed native stocks", () => {
  for (const damage of [
    (world) => world.events = [{ kind: "destroy_owned_actor", fixtureActorId: "home-raider", tick: 200 }],
    (world) => world.constructionOrders = [{ fixtureActorId: "seeded-expansion" }],
    (world) => world.sourceStocks[0].amount = 1000,
    (world) => world.controls.push({ id: "withdraw", action: { kind: "move" } }),
    (world) => world.controls[0].action.targetFixtureActorId = "ready-house"
  ]) {
    const changed = structuredClone(fixture);
    const combat = changed.recipe.variants.find((variant) =>
      changed.assertions["EXP-02"].requiredExpansionPressure.branchByVariant[variant.id] === "combat_resolved");
    damage(combat.presetWorld);
    assert.equal(valid(changed), false);
  }
});
