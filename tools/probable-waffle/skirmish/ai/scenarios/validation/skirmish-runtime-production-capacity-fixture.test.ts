import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validProductionCapacityPair } from "./skirmish-runtime-production-capacity-fixture.ts";

const fixture = JSON.parse(
  readFileSync(
    new URL("../../testing/fixtures/native/production/production-capacity-native-gameplay.json", import.meta.url),
    "utf8"
  )
);

test("focused production pairs differ only by one ready producer", () => {
  for (const id of fixture.scenarioIds) {
    assert.equal(validProductionCapacityPair(fixture.recipe, fixture.assertions[id], id), true);
  }
});

test("a different control balance cannot masquerade as a capacity control", () => {
  const changed = structuredClone(fixture);
  changed.recipe.variants[1].presetWorld.resourceGrants[0].amounts.food += 1;
  assert.equal(validProductionCapacityPair(changed.recipe, changed.assertions["PRO-02"], "PRO-02"), false);
});

test("an unrelated control actor cannot masquerade as the single causal difference", () => {
  const changed = structuredClone(fixture);
  changed.recipe.variants[1].presetWorld.actors.push({
    fixtureActorId: "extra-worker",
    actorName: "TivaraWorkerMale",
    owner: 2,
    position: { x: 800, y: 640, z: 0 }
  });
  assert.equal(validProductionCapacityPair(changed.recipe, changed.assertions["PRO-01"], "PRO-01"), false);
});

test("a research seed cannot become an undeclared capacity-pair variable", () => {
  const changed = structuredClone(fixture);
  changed.recipe.variants[1].presetWorld.researchQueues = [
    { producerFixtureActorId: "producer-1", researchType: "tivaraMacemanUpgradeLevel2" }
  ];
  assert.equal(validProductionCapacityPair(changed.recipe, changed.assertions["PRO-01"], "PRO-01"), false);
});
