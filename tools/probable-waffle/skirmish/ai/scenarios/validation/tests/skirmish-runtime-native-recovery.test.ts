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

test("H-24 retains the nearby native income worker used by its recovery premise", () => {
  const fixture = nativeScenarioFixture("H-24");
  for (const variant of fixture.recipe.variants)
    assert.deepEqual(
      variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "worker-1")?.position,
      tile(32, 32),
      variant.id
    );
});

test("H-24 starts at the probe decision with only its actors and bounded proof window", () => {
  const fixture = nativeScenarioFixture("H-24"),
    contract = fixture.assertions["H-24"].requiredNativeScenario,
    binding = nativeScenarioBindings.cases["H-24"];
  assert.equal(contract.latestTick, 600);
  assert.deepEqual(binding.evidenceCheckpoints, [200, 400]);
  assert.deepEqual(fixture.recipe.checkpointTicks, [20, 200, 400, 600]);
  for (const variant of fixture.recipe.variants) {
    const branch = contract.branchByVariant[variant.id],
      actors = variant.presetWorld.actors,
      roles = actors.map((actor) => actor.fixtureActorId);
    assert.equal(roles.filter((role) => /^army-[0-2]$/.test(role)).length, 3, variant.id);
    assert.equal(roles.filter((role) => role.startsWith("hidden-force-")).length, 16, variant.id);
    assert.equal(
      roles.filter((role) => role.startsWith("known-danger-")).length,
      branch === "unsafe" ? 4 : 0,
      variant.id
    );
    assert.deepEqual(
      roles.filter((role) => !role.startsWith("hidden-force-") && !role.startsWith("known-danger-")).sort(),
      [
        "army-0",
        "army-1",
        "army-2",
        "enemy-deposit",
        "enemy-source",
        "enemy-worker",
        "mission-target",
        "own-deposit",
        "own-source",
        ...(branch === "information" ? ["scout-probe"] : []),
        "worker-1"
      ].sort(),
      variant.id
    );
    if (branch === "information") {
      assert.equal(
        actors.find((actor) => actor.fixtureActorId === "scout-probe")?.actorName,
        variant.aiFaction === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl"
      );
      assert.deepEqual(actors.find((actor) => actor.fixtureActorId === "mission-target")?.position, tile(20, 30));
    }
    if (branch === "raid" || branch === "denial")
      assert.deepEqual(
        ["army-0", "army-1", "army-2"].map((role) => actors.find((actor) => actor.fixtureActorId === role)?.position),
        [tile(23, 26), tile(23, 27), tile(24, 27)],
        `${branch}: start at the bounded opportunity`
      );
    if (branch === "denial")
      assert.deepEqual(
        actors.find((actor) => actor.fixtureActorId === "mission-target")?.position,
        tile(24, 25),
        `${branch}: denial target is inside the response window`
      );
    if (branch === "unsafe")
      assert.deepEqual(
        actors.filter((actor) => actor.fixtureActorId.startsWith("known-danger-")).map((actor) => actor.position),
        [tile(14, 23), tile(16, 23), tile(18, 23), tile(20, 23)],
        variant.id
      );
    assert.deepEqual(variant.presetWorld.resourceStarts.find((start) => start.playerNumber === 2)?.amounts, {
      food: 300,
      wood: 0,
      stone: 0,
      minerals: 0
    });
  }
});

test("H-26 funds the authored paid reinforcement queue before the decision window", () => {
  const fixture = nativeScenarioFixture("H-26"),
    branches = fixture.assertions["H-26"].requiredNativeScenario.branchByVariant;
  for (const variant of fixture.recipe.variants) {
    const noSafeRoute = branches[variant.id] === "no_safe_route";
    assert.deepEqual(variant.presetWorld.resourceGrants.find((grant) => grant.playerNumber === 2)?.amounts, {
      food: 40
    });
    assert.equal(variant.presetWorld.queues?.[0]?.count, noSafeRoute ? 1 : 4);
    if (noSafeRoute)
      assert.deepEqual(variant.presetWorld.resourceStarts.find((start) => start.playerNumber === 2)?.amounts, {
        food: 240,
        wood: 0,
        stone: 0,
        minerals: 0
      });
  }
});

test("H-26 isolates group push, safe alternate, no-route and cleared-threat geometry", () => {
  const fixture = nativeScenarioFixture("H-26"),
    branches = fixture.assertions["H-26"].requiredNativeScenario.branchByVariant;
  assert.equal(fixture.assertions["H-26"].maximumTick, 601);
  assert.deepEqual(fixture.recipe.checkpointTicks, [20, 100, 200, 400, 600, 601]);
  assert.deepEqual(nativeScenarioBindings.cases["H-26"].evidenceCheckpoints, [200, 400, 600]);
  assert.deepEqual(nativeScenarioBindings.cases["H-26"].evidenceCheckpointBranches, [
    "grouping",
    "safe_alternate",
    "no_safe_route",
    "threat_clears"
  ]);
  for (const variant of fixture.recipe.variants) {
    const branch = branches[variant.id],
      world = variant.presetWorld,
      hasAlternatePassage = !world.terrainPatches.some((patch) => patch.x === 24 && patch.y === 38),
      guardCount = world.actors.filter((actor) => actor.fixtureActorId.startsWith("choke-guard-")).length,
      focusedRoles = new Set([
        "ready-producer",
        "ready-house",
        "army-0",
        "scout-probe",
        "mission-target",
        "own-source",
        "own-deposit",
        ...Array.from({ length: 6 }, (_, index) => `worker-${index}`),
        ...(branch === "safe_alternate" ? ["alternative-target"] : [])
      ]);
    assert.equal(hasAlternatePassage, branch === "safe_alternate", `${branch}:alternate passage`);
    assert.equal(
      world.actors.some((actor) => actor.fixtureActorId === "alternative-target"),
      branch === "safe_alternate",
      `${branch}:alternate objective is exclusive to the safe-route case`
    );
    assert.equal(
      world.actors.some((actor) => actor.fixtureActorId === "alternative-observer"),
      false,
      `${branch}:no observer actor joins the AI's military assignments`
    );
    assert.equal(guardCount, branch === "grouping" ? 1 : 4, `${branch}:guard strength`);
    assert.equal(
      world.actors.filter((actor) => actor.fixtureActorId.startsWith("worker-")).length,
      6,
      `${branch}:stable workforce`
    );
    const mapCombatants = world.existingActorBindings.filter((actor) => actor.fixtureActorId.startsWith("map-"));
    assert.deepEqual(
      mapCombatants.map(({ fixtureActorId, actorName, owner }) => ({ fixtureActorId, actorName, owner })),
      variant.aiFaction === "Tivara"
        ? [
            { fixtureActorId: "map-starting-maceman", actorName: "TivaraMacemanMale", owner: 2 },
            { fixtureActorId: "map-opponent-magician", actorName: "SkaduweeMagicianFemale", owner: 1 }
          ]
        : [{ fixtureActorId: "map-starting-magician", actorName: "SkaduweeMagicianFemale", owner: 2 }],
      `${branch}:bind exact unrelated map combatants`
    );
    assert.ok(
      mapCombatants.every((actor) => actor.position === undefined),
      `${branch}:unique map actors need no position selector`
    );
    assert.deepEqual(
      world.events
        .filter((event) => event.id.startsWith("remove-map-") && event.fixtureActorId !== "enemy-home")
        .map((event) => ({ id: event.id, tick: event.tick, fixtureActorId: event.fixtureActorId })),
      mapCombatants.map(({ fixtureActorId }) => ({ id: `remove-${fixtureActorId}`, tick: 1, fixtureActorId })),
      `${branch}:remove map combatants before AI decisions`
    );
    assert.deepEqual(
      world.events.find((event) => event.id === "remove-map-enemy-home"),
      {
        id: "remove-map-enemy-home",
        tick: 1,
        kind: "destroy_owned_actor",
        owner: 1,
        objectName: variant.aiFaction === "Tivara" ? "FrostForge" : "Sandhold",
        fixtureActorId: "enemy-home"
      }
    );
    assert.deepEqual(world.actors.find((actor) => actor.fixtureActorId === "army-0")?.position, tile(12, 36));
    assert.deepEqual(world.actors.find((actor) => actor.fixtureActorId === "mission-target")?.position, tile(14, 36));
    assert.equal(
      world.actors.find((actor) => actor.fixtureActorId === "mission-target")?.actorName,
      variant.aiFaction === "Tivara" ? "FrostForge" : "Sandhold"
    );
    assert.deepEqual(world.actors.find((actor) => actor.fixtureActorId === "scout-probe")?.position, tile(23, 36));
    assert.equal(
      world.actors.find((actor) => actor.fixtureActorId === "scout-probe")?.actorName,
      variant.aiFaction === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl"
    );
    assert.ok(
      world.actors.every(
        (actor) => focusedRoles.has(actor.fixtureActorId) || actor.fixtureActorId.startsWith("choke-guard-")
      ),
      `${branch}:irrelevant map actors removed`
    );
    assert.deepEqual(
      world.initialOrders,
      Array.from({ length: 6 }, (_, index) => ({
        workerFixtureActorId: `worker-${index}`,
        sourceFixtureActorId: "own-source",
        kind: "gather"
      })),
      `${branch}:workers start on the safe home source`
    );
    assert.deepEqual(
      world.productionRallies,
      [
        {
          producerObjectName: variant.aiFaction === "Tivara" ? "AnkGuard" : "InfantryInn",
          owner: 2,
          targetFixtureActorId: "ready-house"
        }
      ],
      `${branch}:stable home rally`
    );
    if (branch === "safe_alternate")
      assert.deepEqual(
        world.actors.find((actor) => actor.fixtureActorId === "alternative-target")?.position,
        tile(18, 39)
      );
    if (branch === "threat_clears")
      assert.ok(
        world.events.filter((event) => event.id.startsWith("loss-choke-guard-")).every((event) => event.tick === 200)
      );
    assert.deepEqual(
      world.actors.find((actor) => actor.fixtureActorId === "ready-house")?.position,
      tile(38, 32),
      `${branch}:safe stationary rally point`
    );
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
    const branch = variant.id.slice(variant.id.lastIndexOf("-") + 1);
    assert.deepEqual(
      world.actors.map((actor) => actor.fixtureActorId).sort(),
      ["army-0", "army-1", "local-attacker", "mission-target", "own-deposit", "own-source", "worker-0"].sort()
    );
    assert.equal(world.routeOutages?.[0]?.fixtureActorIds.includes("army-0"), true);
    assert.equal(
      world.routeOutages?.[0]?.throughTick,
      branch === "pending" ? 1001 : 600,
      `${variant.id}: recovery window`
    );
    assert.equal(world.routeOutages?.[0]?.mode, branch === "error" ? "error" : "pending", `${variant.id}: fault mode`);
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
