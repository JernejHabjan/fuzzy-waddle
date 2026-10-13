import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validProductionContracts } from "./skirmish-runtime-production-contract-fixture.mjs";
import { validateRuntimeRecipeMetadata } from "./skirmish-runtime-recipe-metadata.mjs";

const fixture = JSON.parse(
  readFileSync(new URL("fixtures/production-authority-runtime.json", import.meta.url), "utf8")
);

test("registers all eight branches for both factions with explicit actor roles and no injected planner state", () => {
  validateRuntimeRecipeMetadata(fixture.recipe);
  assert.equal(fixture.recipe.variants.length, 16);
  for (const id of fixture.scenarioIds)
    assert.equal(validProductionContracts(fixture.recipe, fixture.assertions[id], id), true);
  for (const variant of fixture.recipe.variants) {
    assert.equal(variant.presetWorld.requireFactionRoster, true);
    assert.equal(variant.repetitions, undefined);
    assert.equal(variant.evidenceStop, undefined);
    assert.ok(!JSON.stringify(variant.presetWorld).includes("assessment"));
  }
});

test("paired physical inputs retain identical resources, actors and controls except the named producer position", () => {
  const groups = new Map();
  for (const variant of fixture.recipe.variants.filter((variant) => variant.pairId)) {
    groups.set(variant.pairId, [...(groups.get(variant.pairId) ?? []), variant]);
  }
  for (const pair of groups.values()) {
    const canonical = (variant) => ({
      actors: variant.presetWorld.actors.map((actor) =>
        variant.scenarioIds[0] === "PRO-06" && actor.fixtureActorId === "producer"
          ? { ...actor, position: null }
          : actor
      ),
      resources: variant.presetWorld.resourceStarts,
      grants: variant.presetWorld.resourceGrants,
      controls: variant.presetWorld.controls
    });
    assert.deepEqual(canonical(pair[0]), canonical(pair[1]));
  }
});

test("refund worlds use a paid tail and a pre-opening delayed controller, with real probes on both sides", () => {
  for (const variant of fixture.recipe.variants.filter((variant) => variant.id.endsWith("cancel-pending-refund"))) {
    const preset = variant.presetWorld;
    assert.equal(preset.queues[0].count, 2);
    const cancel = preset.controls.find((control) => control.action.kind === "cancel_production");
    assert.equal(cancel.action.setupQueueIndex, 1);
    const probes = preset.controls.filter((control) => control.action.kind === "produce");
    assert.ok(cancel.requestTick < probes[0].applicationTick && probes[0].applicationTick < cancel.applicationTick);
    assert.ok(probes[1].applicationTick > cancel.applicationTick && probes[1].applicationTick < 20);
  }
});
