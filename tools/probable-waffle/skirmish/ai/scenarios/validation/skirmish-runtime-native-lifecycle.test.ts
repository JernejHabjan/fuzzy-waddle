import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioBindings, nativeScenarioFixture } from "../registration/native-scenario-registration.ts";
import { tile } from "../worlds/native-scenario-worlds.ts";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.ts";

test("continuous, optional-release, topology and debug bindings retain their causal controls", () => {
  for (const [id, branch, mutate] of [
    ["H-05", "uncertain", (world) => delete world.receiptFault.holdHistory],
    ["H-05", "paid", (world) => (world.queues = [])],
    ["H-20", "dispose", (world) => world.routeOutages.pop()],
    ["H-23", "builder_late", (world) => (world.routeOutages[0].membership = "optional_passenger")],
    ["H-23", "optional_lost", (world) => (world.events = [])],
    ["H-23", "optional_late", (world) => (world.terrainPatches = [])],
    ["SEQ-03", "congested", (world) => (world.initialOrders = [])],
    ["SEQ-04", "cancel_race", (world) => (world.researchQueues = [])],
    ["SEQ-06", "stair", (world) => (world.events = [])],
    ["SEQ-07", "alternate", (world) => (world.terrainPatches = [])],
    ["D-04", "opening_counter_retreat_recovery", (world) => (world.events = [])],
    ["D-05", "hard", (world) => (world.controls = [])],
    ["DBG-06", "quota", (world) => delete world.receiptFault.holdHistory]
  ] as const) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((value) => contract.branchByVariant[value.id] === branch);
    assert.ok(variant, `${id}:${branch}`);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
  for (const id of ["D-03", "DBG-06"]) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const pair = fixture.recipe.variants.filter(
      (variant) =>
        variant.aiFaction === "Tivara" && (id !== "D-03" || contract.branchByVariant[variant.id].startsWith("easy_"))
    );
    assert.equal(new Set(pair.map((variant) => variant.presetWorld.fixtureId)).size, 1);
  }
});

test("SEQ-08 binds complete supported SP chains and a distinct real MP transfer chain", () => {
  const fixture = nativeScenarioFixture("SEQ-08");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 8);
  assert.equal(fixture.assertions["SEQ-08"].requiredNativeScenario.latestTick, 18000);
  for (const variant of fixture.recipe.variants) {
    const branch = fixture.assertions["SEQ-08"].requiredNativeScenario.branchByVariant[variant.id];
    assert.deepEqual(variant.checkpointTicks, [
      { before_apply: 19, applied_pending: 199, during_active: 119, host_transfer: 19 }[branch],
      400
    ]);
    assert.equal(
      variant.presetWorld.actors.some((actor) => actor.fixtureActorId === "recovery-door"),
      false
    );
    assert.equal(variant.presetWorld.events.length, 0);
    assert.equal(variant.presetWorld.controls.length, 0);
    assert.equal(variant.presetWorld.routeOutages.length, 0);
  }
});

test("DBG-01/03 retain native codec incidents, complete physical replay and isolated stepping/live-read boundaries", () => {
  for (const id of ["DBG-01", "DBG-03"]) {
    const fixture = nativeScenarioFixture(id);
    assert.equal(fixture.recipe.requiresMultiplayer === true, id === "DBG-03");
    assert.equal(fixture.recipe.variants.length, id === "DBG-01" ? 8 : 4);
    for (const variant of fixture.recipe.variants) {
      assert.deepEqual(variant.checkpointTicks, [599, 800]);
      assert.equal(variant.captureConstruction, true);
      assert.equal(variant.presetWorld.constructionOrders.length, 1);
      assert.equal(variant.presetWorld.researchQueues.length, 1);
      assert.equal(variant.presetWorld.queues[0].count, 4);
      assert.equal(variant.presetWorld.events.length, 0);
      assert.equal(variant.presetWorld.controls.length, 0);
      assert.equal(variant.presetWorld.routeOutages.length, 0);
    }
  }
});

test("H-31 binds autonomous single-player codec continuation without unsupported queues or future external inputs", () => {
  const fixture = nativeScenarioFixture("H-31"),
    branches = fixture.assertions["H-31"].requiredNativeScenario.branchByVariant;
  assert.equal(fixture.recipe.variants.length, 8);
  assert.equal(fixture.recipe.requiresMultiplayer, undefined);
  for (const variant of fixture.recipe.variants) {
    const world = variant.presetWorld,
      branch = branches[variant.id];
    assert.equal(world.events.length, 0);
    assert.equal(world.controls.length, 0);
    assert.equal(world.routeOutages.length, 0);
    assert.equal(variant.captureConstruction, true);
    assert.equal(variant.captureCombat, undefined);
    assert.ok(variant.checkpointTicks[0] < variant.checkpointTicks[1]);
    if (branch === "during_active") {
      assert.equal(world.queues[0].count, 4);
      assert.equal(world.researchQueues.length, 1);
      assert.equal(world.constructionOrders.length, 1);
      assert.ok(
        world.resourceGrants.some(
          (entry) =>
            entry.playerNumber === 2 &&
            entry.amounts.food >= 6000 &&
            entry.amounts.wood >= 6000 &&
            entry.amounts.stone >= 3000 &&
            entry.amounts.minerals >= 3000
        )
      );
      assert.equal(
        world.resourceStarts.some((entry) => entry.playerNumber === 2),
        false,
        "paid work must not be refunded by a post-charge exact-balance reset"
      );
      assert.deepEqual(
        world.constructionOrders[0].position,
        tile(5, 40),
        "the active-site save premise must avoid every scenario actor footprint"
      );
      assert.deepEqual(
        world.actors.find((actor) => actor.fixtureActorId === "worker-0").position,
        tile(3, 40),
        "the paid active-site premise must stage its assigned builder on an adjacent legal tile"
      );
    }
    if (branch === "applied_pending") assert.equal(world.receiptFault.throughTick, variant.checkpointTicks[0]);
  }
});

test("H-32 binds real relay promotion, one retained realm and independent pending path/paid-work controls", () => {
  const fixture = nativeScenarioFixture("H-32");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 8);
  for (const faction of ["Tivara", "Skaduwee"]) {
    for (const branch of ["normal", "pending_path", "paid_queue"]) {
      const variant = fixture.recipe.variants.find(
        (entry) =>
          entry.aiFaction === faction &&
          fixture.assertions["H-32"].requiredNativeScenario.branchByVariant[entry.id] === branch
      );
      assert.equal(variant.requiresMultiplayer, false);
    }
    const pending = fixture.recipe.variants.find(
      (variant) =>
        variant.aiFaction === faction &&
        fixture.assertions["H-32"].requiredNativeScenario.branchByVariant[variant.id] === "pending_path"
    );
    assert.deepEqual(pending.presetWorld.routeOutages, [
      { id: "churn-stable-query", fromTick: 1, throughTick: 1001, fixtureActorIds: ["army-0"], mode: "pending" }
    ]);
    const host = fixture.recipe.variants.find(
      (variant) =>
        variant.aiFaction === faction &&
        fixture.assertions["H-32"].requiredNativeScenario.branchByVariant[variant.id] === "host_replacement"
    );
    assert.equal(host.presetWorld, undefined);
    assert.equal(host.executionKind, "focused_natural");
    assert.equal(host.requiresMultiplayer, true);
    assert.ok(host.nextMatchPresetWorld);
  }
  for (const mutate of [
    (value) => delete value.recipe.requiresMultiplayer,
    (value) => (value.recipe.variants.find((variant) => variant.nextMatchPresetWorld).presetWorld = {}),
    (value) => delete value.recipe.variants.find((variant) => variant.nextMatchPresetWorld).nextMatchPresetWorld,
    (value) => (value.recipe.variants.find((variant) => variant.id.endsWith("paid-queue")).checkpointTicks = [4000]),
    (value) =>
      (value.recipe.variants.find((variant) => variant.id.endsWith("pending-path")).presetWorld.routeOutages = [])
  ]) {
    const changed = structuredClone(fixture);
    mutate(changed);
    assert.equal(validNativeScenarioFixture(changed, "H-32"), false);
  }
});

test("DBG-05 retains every hostile import branch and real-peer authorization requirement", () => {
  const fixture = nativeScenarioFixture("DBG-05");
  assert.equal(fixture.recipe.variants.length, 12);
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.deepEqual(nativeScenarioBindings.cases["DBG-05"].branches, [
    "malformed",
    "oversized",
    "version_mismatch",
    "traversal",
    "html",
    "unauthorized_peer"
  ]);
  assert.ok(
    fixture.recipe.variants.every((variant) => variant.checkpointTicks[0] === 20 && !variant.captureConstruction)
  );
  delete fixture.recipe.requiresMultiplayer;
  assert.equal(validNativeScenarioFixture(fixture, "DBG-05"), false);
});
