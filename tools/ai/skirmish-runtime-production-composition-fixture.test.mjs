import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validProductionCompositionPair } from "./skirmish-runtime-production-composition-fixture.mjs";
import { validateManifest } from "./skirmish-matrix-fixtures.mjs";
import { validateEvidenceStopAssertions } from "./skirmish-runtime-recipe-metadata.mjs";
import { fileURLToPath } from "node:url";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/focused-production-composition-runtime.json", import.meta.url)));
const requirement = fixture.assertions["PRO-04"];

test("ready and paid-queue production pairs validate independently for both factions", () => {
  assert.equal(validProductionCompositionPair(fixture.recipe, requirement, "PRO-04"), true);
  const manifest = JSON.parse(readFileSync(new URL("./fixtures/skirmish-v1.json", import.meta.url)));
  validateManifest(manifest, fileURLToPath(new URL("./fixtures", import.meta.url)));
  assert.equal(manifest.rows.find((row) => row.id === "PRO-04").fixture, "focused-production-composition-runtime.json");
});

test("composition controls cannot change resources, unrelated actors, queues or the branch contract", () => {
  const mutations = [
    (copy) => { copy.recipe.variants[1].presetWorld.resourceStarts[0].amounts.food += 1; },
    (copy) => { copy.recipe.variants[1].presetWorld.actors[0].position.x += 1; },
    (copy) => { copy.recipe.variants[1].presetWorld.actors.at(-1).actorName = "TivaraSlingshotFemale"; },
    (copy) => { copy.recipe.variants[1].presetWorld.actors.at(-1).owner = 1; },
    (copy) => { copy.recipe.variants[1].presetWorld.actors.pop(); },
    (copy) => { copy.recipe.variants[1].presetWorld.actors.push(copy.recipe.variants[1].presetWorld.actors[0]); },
    (copy) => { copy.recipe.variants[0].presetWorld.queues.push({ producerFixtureActorId: "producer-1",
      actorName: "TivaraMacemanMale", count: 2 }); },
    (copy) => { copy.recipe.variants[1].productionCompositionBranch = "fill_deficit"; },
    (copy) => { copy.recipe.variants[1].presetWorld.researchQueues = [
      { producerFixtureActorId: "producer-1", researchType: "tivaraMacemanUpgradeLevel2" }
    ]; },
    (copy) => { copy.recipe.variants[1].seed += 1; },
    (copy) => { copy.recipe.variants[1].humanFaction = "Tivara"; },
    (copy) => { copy.recipe.variants.pop(); }
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(fixture);
    mutate(copy);
    assert.equal(validProductionCompositionPair(copy.recipe, copy.assertions["PRO-04"], "PRO-04"), false);
  }
});

test("queue provenance requires two distinct paid producers in its own seeded-control pair", () => {
  for (const mutate of [
    (copy) => { copy.recipe.variants[5].presetWorld.queues.pop(); },
    (copy) => { copy.recipe.variants[5].presetWorld.queues[1].producerFixtureActorId = "missing-producer"; },
    (copy) => { copy.recipe.variants[5].presetWorld.queues[1].producerFixtureActorId = "housing"; },
    (copy) => { copy.recipe.variants[5].presetWorld.queues[1].actorName = "TivaraSlingshotFemale"; },
    (copy) => { copy.recipe.variants[5].seed += 1; },
    (copy) => { copy.recipe.variants[5].pairId = copy.recipe.variants[1].pairId; }
  ]) {
    const copy = structuredClone(fixture);
    mutate(copy);
    assert.equal(validProductionCompositionPair(copy.recipe, copy.assertions["PRO-04"], "PRO-04"), false);
  }
});

test("malformed deadlines, a missing faction product and early stop cannot shorten absence proof", () => {
  for (const change of [{ latestTick: 601 }, { stableForTicks: 0 }, { stableForTicks: 600 },
    { additionalUnitCount: 1 }, { targetMilitaryCount: 2 }, { unitObjectNameByFaction: { Tivara: "TivaraMacemanMale" } }]) {
    assert.equal(validProductionCompositionPair(fixture.recipe,
      { ...requirement, requiredProductionComposition: { ...requirement.requiredProductionComposition, ...change } }, "PRO-04"), false);
  }
  const copy = structuredClone(fixture);
  copy.recipe.variants[0].evidenceStop = { earliestTick: 200, stableForTicks: 200 };
  assert.equal(validProductionCompositionPair(copy.recipe, copy.assertions["PRO-04"], "PRO-04"), false);
  assert.throws(() => validateEvidenceStopAssertions(copy), /runtime_recipe_evidence_stop_unsafe/);
});
