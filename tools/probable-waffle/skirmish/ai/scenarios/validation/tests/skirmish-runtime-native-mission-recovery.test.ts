import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioBindings, nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";
import { tile } from "../../worlds/native-world-geometry.ts";

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
