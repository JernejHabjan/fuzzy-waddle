import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validEconomyContracts, validResourceRecoveryContract } from "./skirmish-runtime-economy-fixture.mjs";

const economy = JSON.parse(readFileSync(new URL("./fixtures/economy-delivery-runtime.json", import.meta.url)));
const recovery = JSON.parse(readFileSync(new URL("./fixtures/resource-recovery-runtime.json", import.meta.url)));

test("economy and source recovery recipes expose every required native branch", () => {
  for (const id of ["ECO-05", "H-16"])
    assert.equal(validEconomyContracts(economy.recipe, economy.assertions[id], id), true);
  assert.equal(validResourceRecoveryContract(recovery.recipe, recovery.assertions["ECO-06"]), true);
});
test("empty or mistyped branches, unsupported pacing and missing receipt floor fail closed", () => {
  for (const mutate of [
    (f) => {
      f.assertions["ECO-05"].requiredEconomyContracts = {};
    },
    (f) => {
      f.assertions["ECO-05"].requiredEconomyContracts["economy-shared-budget"].branch = "budget_typo";
    },
    (f) => {
      f.recipe.fixedStepFrames = false;
    },
    (f) => {
      f.assertions["ECO-05"].requiredEconomyContracts["economy-surplus-labor"].minimumDelivered = 0;
    }
  ]) {
    const copy = structuredClone(economy);
    mutate(copy);
    assert.equal(validEconomyContracts(copy.recipe, copy.assertions["ECO-05"], "ECO-05"), false);
  }
});
test("recovery cannot silently change the physical source, stock, loss or deadline", () => {
  for (const mutate of [
    (f) => {
      f.recipe.variants[0].presetWorld.sourceStocks[0].amount = 4;
    },
    (f) => {
      f.assertions["ECO-06"].requiredResourceRecovery.sourceFixtureActorId = "missing";
    },
    (f) => {
      f.recipe.variants[0].presetWorld.events[0].tick = 1200;
    },
    (f) => {
      f.assertions["ECO-06"].requiredResourceRecovery.latestTick = 1400;
    }
  ]) {
    const copy = structuredClone(recovery);
    mutate(copy);
    assert.equal(validResourceRecoveryContract(copy.recipe, copy.assertions["ECO-06"]), false);
  }
});
