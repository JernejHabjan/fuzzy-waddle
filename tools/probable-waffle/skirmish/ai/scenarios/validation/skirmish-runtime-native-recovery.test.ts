import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { nativeScenarioBindings, nativeScenarioFixture } from "../registration/native-scenario-registration.ts";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.ts";

test("H-30 holds the faction's late native queue command and samples after release", () => {
  const fixture = nativeScenarioFixture("H-30"),
    contract = fixture.assertions["H-30"].requiredNativeScenario;
  assert.equal(contract.latestTick, 4000);
  assert.ok(fixture.recipe.checkpointTicks.includes(4000));
  for (const variant of fixture.recipe.variants) {
    assert.equal(
      variant.presetWorld.receiptFault.commandKind,
      variant.aiFaction === "Skaduwee" ? "production" : "research"
    );
    assert.equal(variant.presetWorld.receiptFault.throughTick, variant.aiFaction === "Skaduwee" ? 1800 : 2800);
    assert.equal(variant.presetWorld.brainFault.throughTick, 800);
  }
});

test("all supported native bindings are connected and no executable registration hides behind a draft", () => {
  const drafts = JSON.parse(
    readFileSync(
      new URL("../../testing/fixtures/authoring/unexecuted-native-scenario-recipes.json", import.meta.url),
      "utf8"
    )
  );
  assert.deepEqual(drafts.scenarioIds, []);
  assert.deepEqual(drafts.cases, []);
  const manifest = JSON.parse(
    readFileSync(new URL("../../testing/fixtures/skirmish-scenario-manifest.json", import.meta.url), "utf8")
  );
  assert.deepEqual(
    manifest.rows.filter((row) => row.drivers.includes("runtime") && !row.fixture && !row.runtimeSupport),
    []
  );
});

test("H-09 retains real compaction, SP codec restore and independent peer acknowledgment branches", () => {
  const fixture = nativeScenarioFixture("H-09");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 6);
  assert.ok(fixture.recipe.checkpointTicks.includes(20));
  assert.ok(fixture.recipe.checkpointTicks.includes(199));
  assert.equal(fixture.assertions["H-09"].requiredNativeScenario.latestTick, 2400);
  for (const variant of fixture.recipe.variants) {
    assert.equal(variant.captureConstruction, true);
    assert.equal(variant.captureCombat, true);
    assert.equal(variant.presetWorld.receiptFault.holdHistory, true);
  }
});

test("H-08 retains original timeout/cancel boundaries and both real old-epoch delivery orders", () => {
  const fixture = nativeScenarioFixture("H-08");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 8);
  assert.ok(fixture.recipe.checkpointTicks.includes(199));
  assert.ok(fixture.recipe.checkpointTicks.includes(1801));
  for (const variant of fixture.recipe.variants) {
    assert.equal(variant.presetWorld.receiptFault.holdHistory, true);
    assert.equal(variant.presetWorld.receiptFault.throughTick, 1800);
    assert.equal(variant.presetWorld.receiptFault.maximumCommands, 1);
  }
});

test("native cases cannot downgrade to generic counts or omit a faction, branch or physical channel", () => {
  for (const id of Object.keys(nativeScenarioBindings.cases))
    for (const mutate of [
      (value) => delete value.assertions[id].requiredNativeScenario,
      (value) => value.recipe.variants.pop(),
      (value) =>
        (value.recipe.variants[0].captureCombat = value.recipe.variants[0].captureCombat === true ? undefined : true),
      (value) =>
        (value.recipe.variants[0].captureConstruction =
          value.recipe.variants[0].captureConstruction === true ? undefined : true),
      (value) => (value.recipe.variants[0].evidenceStop = { earliestTick: 20, stableForTicks: 0 }),
      (value) => value.recipe.variants[0].seed++,
      (value) => {
        const variant = value.recipe.variants[0];
        const bank = variant.presetWorld?.resourceStarts[0];
        if (bank) bank.amounts.wood++;
        else variant.mapLabel = "invented-native-map";
      },
      (value) => (value.assertions[id].requiredNativeScenario.branchByVariant.invented = "quiet")
    ]) {
      const fixture = nativeScenarioFixture(id);
      mutate(fixture);
      assert.equal(validNativeScenarioFixture(fixture, id), false, id);
    }
});

test("source-controlled worlds reject erased perturbations, fake observations and altered topology", () => {
  for (const [id, branch, mutate] of [
    ["SCOUT-02", "hidden_health", (world) => (world.events = [])],
    ["SCOUT-02", "hidden_queue", (world) => (world.controls = [])],
    ["WALL-01", "terrain", (world) => (world.terrainPatches = [])],
    ["FIGHT-05", "stun", (world) => (world.completedResearch = [])],
    ["FIGHT-04", "healing", (world) => (world.completedResearch = [])],
    ["STRAT-10", "combined_loss", (world) => (world.events = [])],
    ["STRAT-07", "breach", (world) => (world.events = [])],
    ["H-28", "prefix", (world) => (world.sourceStocks = [])]
  ] as const) {
    const fixture = nativeScenarioFixture(id),
      binding = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((variant) => binding.branchByVariant[variant.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

test("capability-specific spell branches never invent the other faction's caster", () => {
  const fight = nativeScenarioFixture("FIGHT-05"),
    binding = fight.assertions["FIGHT-05"].requiredNativeScenario;
  for (const variant of fight.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    if (branch === "stun") assert.equal(variant.humanFaction, "Skaduwee");
    if (branch === "slow") assert.equal(variant.humanFaction, "Tivara");
  }
});

test("unsupported naval and diplomacy content is explicit rather than silently invented", () => {
  const waterOnly = nativeScenarioFixture("DOMAIN-01");
  assert.deepEqual(
    waterOnly.recipe.variants.map(
      (variant) => waterOnly.assertions["DOMAIN-01"].requiredNativeScenario.branchByVariant[variant.id]
    ),
    ["irrelevant", "irrelevant"]
  );
  const naval = nativeScenarioFixture("DOMAIN-02");
  assert.ok(
    naval.recipe.variants.some(
      (variant) => naval.assertions["DOMAIN-02"].requiredNativeScenario.branchByVariant[variant.id] === "coast"
    )
  );
  assert.ok(naval.capabilityLimits.length);
  assert.deepEqual(
    naval.recipe.variants
      .filter((v) => v.aiFaction === "Skaduwee")
      .map((v) => naval.assertions["DOMAIN-02"].requiredNativeScenario.branchByVariant[v.id]),
    ["unsupported"]
  );
  assert.ok(nativeScenarioFixture("C-06").capabilityLimits.some((limit) => limit.includes("unsupported")));
});

test("recovery bindings preserve actual obstruction, healthy work and finite pending/error inputs", () => {
  for (const [id, branch, mutate] of [
    ["H-01", "persistent", (world) => (world.events = [])],
    ["H-02", "circling_worker", (world) => (world.controls = [])],
    ["H-03", "training", (world) => (world.queues = [])],
    ["H-03", "crop", (world) => (world.initialOrders = [])],
    [
      "H-04",
      "income_parent",
      (world) => (world.actors = world.actors.filter((a) => a.fixtureActorId !== "blocked-source"))
    ],
    ["H-19", "pending", (world) => (world.routeOutages[0].mode = "null")],
    ["H-19", "error", (world) => (world.routeOutages[0].mode = "pending")],
    [
      "H-24",
      "unsafe",
      (world) => (world.actors = world.actors.filter((a) => !a.fixtureActorId.startsWith("known-danger-")))
    ],
    ["H-25", "alternative", (world) => (world.controls = [])],
    ["H-26", "threat_clears", (world) => (world.events = [])]
  ] as const) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((value) => contract.branchByVariant[value.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

test("H-21 native larger-unit clearance is explicitly deferred by the user", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../../testing/fixtures/skirmish-scenario-manifest.json", import.meta.url), "utf8")
  );
  const row = manifest.rows.find((row) => row.id === "H-21");
  assert.equal(Object.hasOwn(nativeScenarioBindings.cases, "H-21"), false);
  assert.equal(row.runtimeRecipeDraft, undefined);
  assert.equal(row.runtimeSupport.status, "deferred_content");
  assert.equal(row.runtimeSupport.issue, 759);
  assert.match(row.runtimeSupport.reason, /User 2026-10-21/);
});
