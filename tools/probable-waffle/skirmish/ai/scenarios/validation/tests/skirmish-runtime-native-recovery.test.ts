import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { nativeScenarioBindings, nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";
import { tile } from "../../worlds/native-world-geometry.ts";
import { validNativeScenarioFixture } from "../skirmish-runtime-native-scenario-fixture.ts";

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
      new URL("../../../testing/fixtures/authoring/unexecuted-native-scenario-recipes.json", import.meta.url),
      "utf8"
    )
  );
  assert.deepEqual(drafts.scenarioIds, []);
  assert.deepEqual(drafts.cases, []);
  const manifest = JSON.parse(
    readFileSync(new URL("../../../testing/fixtures/skirmish-scenario-manifest.json", import.meta.url), "utf8")
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
  assert.equal(waterOnly.assertions["DOMAIN-01"].maximumTick, 400);
  assert.deepEqual(waterOnly.recipe.checkpointTicks, [20, 100, 199, 200, 399, 400]);
  for (const variant of waterOnly.recipe.variants) {
    assert.deepEqual(variant.presetWorld.actors.map((actor) => actor.fixtureActorId).sort(), [
      "army-0",
      "contact-group",
      "enemy-producer",
      "own-deposit",
      "own-source",
      "ready-granary",
      "ready-house",
      "ready-producer",
      "worker-0",
      "worker-1"
    ]);
    assert.ok(variant.presetWorld.terrainPatches.some((patch) => patch.terrain === "water"));
    assert.deepEqual(variant.presetWorld.initialOrders, []);
  }
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

test("H-03 long journeys isolate one moving actor and stop after the recovery window", () => {
  const fixture = nativeScenarioFixture("H-03");
  assert.equal(fixture.assertions["H-03"].maximumTick, 1600);
  for (const variant of fixture.recipe.variants.filter((entry) =>
    ["travel", "stalled"].includes(fixture.assertions["H-03"].requiredNativeScenario.branchByVariant[entry.id])
  )) {
    assert.deepEqual(variant.presetWorld.actors.map((actor) => actor.fixtureActorId).sort(), [
      "army-0",
      "mission-target"
    ]);
    assert.deepEqual(variant.presetWorld.initialOrders, []);
    assert.deepEqual(variant.presetWorld.resourceStarts.find((start) => start.playerNumber === 2)?.amounts, {
      food: 0,
      wood: 0,
      stone: 0,
      minerals: 0
    });
    assert.equal(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "army-0")?.position.x, 0);
    assert.equal(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "army-0")?.position.y, 1472);
    assert.equal(
      variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "mission-target")?.position.x,
      -288
    );
    if (fixture.assertions["H-03"].requiredNativeScenario.branchByVariant[variant.id] === "stalled")
      assert.equal(variant.presetWorld.routeOutages?.[0]?.throughTick, 1001);
    assert.equal(variant.checkpointTicks?.at(-1), 1600);
  }
});

test("H-03 long-work branches use only their needed roles and bounded horizons", () => {
  const fixture = nativeScenarioFixture("H-03"),
    branches = fixture.assertions["H-03"].requiredNativeScenario.branchByVariant;
  for (const variant of fixture.recipe.variants.filter((entry) => ["training", "crop"].includes(branches[entry.id]))) {
    const branch = branches[variant.id];
    assert.deepEqual(
      variant.presetWorld.actors.map((actor) => actor.fixtureActorId).sort(),
      branch === "training"
        ? [
            "own-deposit",
            "own-source",
            "ready-house",
            "ready-producer",
            "recovery-house-0",
            "worker-0",
            "worker-1"
          ].sort()
        : ["healthy-field", "own-deposit", "own-source", "ready-granary", "worker-0", "worker-1"].sort()
    );
    assert.deepEqual(variant.presetWorld.resourceStarts.find((start) => start.playerNumber === 2)?.amounts, {
      food: branch === "training" ? 0 : 300,
      wood: 0,
      stone: 0,
      minerals: 0
    });
    if (branch === "crop") {
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "healthy-field")?.position,
        tile(35, 27)
      );
      assert.equal(variant.checkpointTicks?.at(-1), 1600);
    } else {
      assert.deepEqual(variant.presetWorld.resourceGrants.find((grant) => grant.playerNumber === 2)?.amounts, {
        food: 180
      });
      assert.equal(variant.presetWorld.queues?.[0]?.count, 3);
      assert.equal(variant.checkpointTicks?.at(-1), 1600);
    }
  }
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

test("H-19 isolates optional route failure from nearby defense and bounds query recovery", () => {
  const fixture = nativeScenarioFixture("H-19"),
    contract = fixture.assertions["H-19"].requiredNativeScenario;
  assert.equal(contract.latestTick, 1040);
  assert.deepEqual(nativeScenarioBindings.cases["H-19"].evidenceCheckpoints, [1020]);
  assert.deepEqual(fixture.recipe.checkpointTicks, [20, 200, 400, 600, 800, 1000, 1020, 1040]);
  for (const variant of fixture.recipe.variants) {
    const world = variant.presetWorld;
    assert.deepEqual(
      world.actors.map((actor) => actor.fixtureActorId).sort(),
      ["army-0", "army-1", "local-attacker", "mission-target", "own-deposit", "own-source", "worker-0"].sort()
    );
    assert.equal(world.routeOutages?.[0]?.fixtureActorIds.includes("army-0"), true);
    assert.equal(world.controls.find((entry) => entry.id === "local-real-attack")?.applicationTick, 200);
    assert.deepEqual(world.resourceStarts.find((entry) => entry.playerNumber === 2)?.amounts, {
      food: 300,
      wood: 0,
      stone: 0,
      minerals: 0
    });
  }
});

test("H-21 native larger-unit clearance is explicitly deferred by the user", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../../../testing/fixtures/skirmish-scenario-manifest.json", import.meta.url), "utf8")
  );
  const row = manifest.rows.find((row) => row.id === "H-21");
  assert.equal(Object.hasOwn(nativeScenarioBindings.cases, "H-21"), false);
  assert.equal(row.runtimeRecipeDraft, undefined);
  assert.equal(row.runtimeSupport.status, "deferred_content");
  assert.equal(row.runtimeSupport.issue, 759);
  assert.match(row.runtimeSupport.reason, /User 2026-10-21/);
});
