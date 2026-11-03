import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioFixture } from "../registration/native-scenario-registration.ts";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.ts";

test("authority and priority bindings reject erased consumer faults and altered native premises", () => {
  for (const [id, branch, mutate] of [
    ["H-12", "permuted", (world) => (world.proposalOrder = "forward")],
    ["H-12", "paid_neighbor", (world) => (world.constructionOrders = [])],
    ["H-11", "infeasible", (world) => (world.sourceStocks = [])],
    ["H-11", "bootstrap", (world) => delete world.recoveryStart],
    ["H-30", "debug", (world) => delete world.brainFault],
    ["H-30", "mandatory", (world) => (world.brainFault.kind = "throw")],
    ["H-06", "rejected", (world) => delete world.receiptFault.contendQueue],
    ["H-07", "destroyed", (world) => delete world.receiptFault.destroyOutput],
    ["H-10", "below_capacity", (world) => world.receiptFault.maximumCommands++],
    ["H-10", "resumed", (world) => world.receiptFault.throughTick++],
    ["H-13", "new_identity", (world) => (world.controls = [])],
    ["H-13", "essential", (world) => (world.events = [])],
    ["H-14", "harmless", (world) => (world.controls = [])],
    ["H-15", "lethal", (world) => delete world.receiptFault.holdHistory],
    [
      "H-15",
      "resolved",
      (world) => (world.controls = world.controls.filter((control) => control.applicationTick < 1000))
    ]
  ] as const) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((value) => contract.branchByVariant[value.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

test("H-06/H-07 keep the receipt fault active through their first native production demand", () => {
  for (const id of ["H-06", "H-07"]) {
    const fixture = nativeScenarioFixture(id),
      identities = new Map();
    for (const variant of fixture.recipe.variants) {
      assert.equal(variant.presetWorld.receiptFault.commandKind, "production");
      assert.equal(variant.presetWorld.receiptFault.throughTick, 1800);
      assert.equal(
        variant.presetWorld.actors.filter((actor) => actor.fixtureActorId.startsWith("army-")).length,
        2,
        `${id}/${variant.id}: keep a real native production demand reachable`
      );
      const branch = fixture.assertions[id].requiredNativeScenario.branchByVariant[variant.id];
      identities.set(variant.aiFaction, [...(identities.get(variant.aiFaction) ?? []), variant.presetWorld.fixtureId]);
      if (id === "H-06" && branch === "rejected") assert.equal(variant.presetWorld.receiptFault.contendQueue, true);
      if (id === "H-07" && branch === "destroyed") assert.equal(variant.presetWorld.receiptFault.destroyOutput, true);
    }
    for (const fixtureIds of identities.values()) assert.equal(new Set(fixtureIds).size, 1);
  }
});
