import assert from "node:assert/strict";
import { test } from "node:test";
import { validProductionContracts } from "./skirmish-runtime-production-contract-fixture.mjs";

function fixture(scenarioId) {
  const branches = scenarioId === "PRO-03" ? ["future_committed", "future_abandoned"] :
    scenarioId === "PRO-06" ? ["critical_exposed", "safe_served", "low_value", "no_demand"] :
      ["shared_contention", "cancel_pending_refund"];
  const variants = ["Tivara", "Skaduwee"].flatMap((faction) => branches.map((branch, index) => ({
    id: `${faction}-${branch}`, aiFaction: faction, scenarioIds: [scenarioId],
    ...(scenarioId !== "PRO-07" ? { pairId: `${faction}-pair-${Math.floor(index / 2)}` } : {}),
    role: scenarioId === "PRO-07" ? "standalone" : index % 2 ? "control" : "subject"
  })));
  return {
    recipe: { checkpointTicks: [0, 100, 200], variants },
    assertion: {
      requiredAiFactions: ["Tivara", "Skaduwee"], maximumTick: 200,
      requiredProductionContracts: Object.fromEntries(variants.map((variant, index) => [variant.id, {
        scenarioId, latestTick: 200, stableForTicks: 50, branch: branches[index % branches.length],
        producerObjectName: `${variant.aiFaction}Producer`, productKey: `${variant.aiFaction}Product`,
        pairId: variant.pairId ?? `${variant.id}-world`
      }]))
    }
  };
}

for (const id of ["PRO-03", "PRO-06", "PRO-07"]) {
  test(`${id} accepts explicit per-faction contract shapes, without claiming definition/runtime proof`, () => {
    const { recipe, assertion } = fixture(id);
    assert.equal(validProductionContracts(recipe, assertion, id), true);
  });
}

test("rejects malformed, missing, orphaned, mismatched and early-stopped contracts", () => {
  for (const change of [
    (value) => { delete value.assertion.requiredProductionContracts[value.recipe.variants[0].id]; },
    (value) => {
      value.assertion.requiredProductionContracts.orphan = value.assertion.requiredProductionContracts[value.recipe.variants[0].id];
    },
    (value) => { value.assertion.requiredProductionContracts[value.recipe.variants[0].id].brainState = {}; },
    (value) => { value.assertion.requiredProductionContracts[value.recipe.variants[0].id].scenarioId = "PRO-07"; },
    (value) => { value.assertion.requiredProductionContracts[value.recipe.variants[0].id].latestTick = 199; },
    (value) => { value.assertion.requiredProductionContracts[value.recipe.variants[0].id].stableForTicks = 200; },
    (value) => { value.assertion.requiredProductionContracts[value.recipe.variants[0].id].productKey = " "; },
    (value) => { value.assertion.requiredProductionContracts[value.recipe.variants[0].id].pairId = "other"; },
    (value) => { value.recipe.variants[0].evidenceStop = { earliestTick: 100, stableForTicks: 50 }; },
    (value) => { value.recipe.variants[0].checkpointTicks = [0, 100]; }
  ]) {
    const value = fixture("PRO-03");
    change(value);
    assert.equal(validProductionContracts(value.recipe, value.assertion, "PRO-03"), false);
  }
});

test("requires every resilience/queue branch and rejects false pairing of separate queue worlds", () => {
  for (const id of ["PRO-06", "PRO-07"]) {
    const value = fixture(id);
    const contracts = value.assertion.requiredProductionContracts;
    contracts[value.recipe.variants[1].id].branch = contracts[value.recipe.variants[0].id].branch;
    assert.equal(validProductionContracts(value.recipe, value.assertion, id), false);
  }
  const value = fixture("PRO-07");
  value.recipe.variants[0].role = "subject";
  assert.equal(validProductionContracts(value.recipe, value.assertion, "PRO-07"), false);
  assert.equal(validProductionContracts(value.recipe, value.assertion, "PRO-04"), false);
});
