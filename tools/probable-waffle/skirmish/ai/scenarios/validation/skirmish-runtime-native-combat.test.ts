import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioFixture } from "../registration/native-scenario-registration.ts";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.ts";

test("FIGHT-01 starts its favorable contact close to the authored army", () => {
  const fixture = nativeScenarioFixture("FIGHT-01");
  for (const variant of fixture.recipe.variants) {
    assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position, {
      x: 96,
      y: 848,
      z: 0
    });
  }
});

test("FIGHT-02 starts every valuable ranged probe at its authored damaged health", () => {
  const fixture = nativeScenarioFixture("FIGHT-02");
  for (const variant of fixture.recipe.variants) {
    assert.deepEqual(variant.presetWorld.healthStarts, [
      { fixtureActorId: "ranged-probe", healthPermille: 400, armourPermille: 0 }
    ]);
  }
});

test("FIGHT-03 unequal fronts retain a durable primary, isolated contact and matched loss event", () => {
  const fixture = nativeScenarioFixture("FIGHT-03");
  for (const variant of fixture.recipe.variants.filter((entry) => /(?:unequal|infeasible)$/.test(entry.id))) {
    const world = variant.presetWorld;
    const primary = world.actors.find((actor) => actor.fixtureActorId === "front-target-a");
    const secondary = world.actors.find((actor) => actor.fixtureActorId === "front-target-b");
    assert.equal(primary?.actorName, variant.aiFaction === "Tivara" ? "FrostForge" : "Sandhold");
    assert.equal(secondary?.actorName, variant.aiFaction === "Tivara" ? "InfantryInn" : "AnkGuard");
    assert.deepEqual(secondary?.position, { x: 160, y: 1296, z: 0 });
    assert.equal(world.actors.filter((actor) => actor.fixtureActorId.startsWith("front-reinforcement-")).length, 6);
    if (variant.id.endsWith("infeasible")) {
      const loss = world.events.find((event) => event.id === "loss-front-target-a");
      assert.equal(loss?.tick, 400);
      assert.equal(loss?.fixtureActorId, primary.fixtureActorId);
      assert.equal(loss?.objectName, primary.actorName);
    }
  }
});

test("FIGHT-04 support branches start with only their tested native spell already researched", () => {
  const fixture = nativeScenarioFixture("FIGHT-04"),
    binding = fixture.assertions["FIGHT-04"].requiredNativeScenario;
  for (const variant of fixture.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    if (branch === "overkill") {
      assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position, {
        x: 128,
        y: 864,
        z: 0
      });
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "front-target-a")?.position,
        { x: 0, y: 864, z: 0 }
      );
      continue;
    }
    if (!["healing", "zone", "support_expiry", "pending_effect"].includes(branch)) continue;
    const researchType =
      branch === "zone"
        ? "firestormSpell"
        : branch === "support_expiry"
          ? "healingTotemSpell"
          : variant.aiFaction === "Tivara"
            ? "healingRainSpell"
            : "healingLightSpell";
    assert.deepEqual(variant.presetWorld.completedResearch, [{ playerNumber: 2, researchType }]);
    assert.equal(variant.presetWorld.researchQueues, undefined);
    if (["healing", "support_expiry", "pending_effect"].includes(branch))
      assert.ok(
        variant.presetWorld.healthStarts.some(
          (start) => start.fixtureActorId === "support-probe" && start.healthPermille === 350
        ),
        `${variant.id}:wounded caster supplies an in-range ally target`
      );
    if (branch === "zone")
      assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position, {
        x: 64,
        y: 896,
        z: 0
      });
  }
});

test("FIGHT-05 target-loss starts in attack range and removes the contact after native damage begins", () => {
  const fixture = nativeScenarioFixture("FIGHT-05");
  const variant = fixture.recipe.variants.find((candidate) => candidate.id === "fight-05-tivara-target-loss");
  assert.ok(variant);
  assert.deepEqual(
    variant.presetWorld.events.find((event) => event.id === "loss-contact-group"),
    {
      id: "loss-contact-group",
      tick: 200,
      kind: "destroy_owned_actor",
      owner: 1,
      objectName: "SkaduweeWarriorMale",
      fixtureActorId: "contact-group"
    }
  );
  assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position, {
    x: 64,
    y: 800,
    z: 0
  });
});

test("FIGHT-05 status controls cast researched spells before combat removes the caster", () => {
  const fixture = nativeScenarioFixture("FIGHT-05"),
    binding = fixture.assertions["FIGHT-05"].requiredNativeScenario;
  for (const variant of fixture.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    if (!["stun", "slow"].includes(branch)) continue;
    const spellType = branch === "stun" ? "snowstorm" : "frostNova";
    const researchType = branch === "stun" ? "snowstormSpell" : "frostNovaSpell";
    assert.deepEqual(variant.presetWorld.completedResearch, [{ playerNumber: 1, researchType }]);
    assert.equal(variant.presetWorld.researchQueues, undefined);
    assert.deepEqual(
      variant.presetWorld.controls.find((control) => control.id === "native-status"),
      {
        id: "native-status",
        producerFixtureActorId: "enemy-caster",
        requestTick: 20,
        applicationTick: 20,
        action: { kind: "cast", spellType, targetFixtureActorId: "ranged-probe" }
      }
    );
  }
});

test("FIGHT-05 disconnected contact uses its native terrain obstruction without a dead-worker wall control", () => {
  const fixture = nativeScenarioFixture("FIGHT-05");
  const variant = fixture.recipe.variants.find((candidate) => candidate.id === "fight-05-tivara-disconnected");
  assert.ok(variant);
  assert.equal(
    variant.presetWorld.controls.some((control) => control.id === "block-route"),
    false
  );
  assert.ok(variant.presetWorld.terrainPatches.some((patch) => patch.blocked));
});

test("mission bindings cannot erase native transport, outages, team controls or the terminal horizon", () => {
  for (const [id, branch, mutate] of [
    ["RAID-03", "boat_raid", (v) => (v.presetWorld.controls = [])],
    ["STRAT-09", "path_outage", (v) => delete v.presetWorld.routeOutages],
    ["C-06", "defeated", (v) => delete v.additionalAiPlayers],
    ["C-06", "allied_control", (v) => (v.lobbyTeams = [])],
    [
      "DOMAIN-02",
      "intercept",
      (v) => (v.presetWorld.actors.find((a) => a.fixtureActorId === "contact-group").owner = 1)
    ],
    ["STRAT-08", "exposed", (v) => (v.checkpointTicks = [20, 4000])]
  ] as const) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((v) => contract.branchByVariant[v.id] === branch);
    assert.ok(variant);
    mutate(variant);
    assert.equal(validNativeScenarioFixture(fixture, id), false, id);
  }
});

test("DOMAIN-02 makes positive coast access naval and limits transport controls to escort", () => {
  const fixture = nativeScenarioFixture("DOMAIN-02"),
    binding = fixture.assertions["DOMAIN-02"].requiredNativeScenario;
  const variants = fixture.recipe.variants.map((variant) => ({
    variant,
    branch: binding.branchByVariant[variant.id]
  }));
  for (const { variant, branch } of variants) {
    const water = new Set(
      variant.presetWorld.terrainPatches
        .filter((patch) => patch.terrain === "water")
        .map((patch) => `${patch.x},${patch.y}`)
    );
    for (let y = 12; y <= 32; y++) assert.ok(water.has(`28,${y}`), `${branch}: disconnected water at 28,${y}`);
    for (let x = 26; x <= 28; x++)
      for (let y = 23; y <= 25; y++)
        assert.ok(water.has(`${x},${y}`), `${branch}: naval river crossing unexpectedly has land at ${x},${y}`);
    if (branch === "coast") {
      const objective = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group");
      const scout = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "scout-probe");
      assert.equal(objective.actorName, "WorkMill");
      assert.deepEqual(objective.position, { x: 608, y: 528, z: 0 });
      assert.deepEqual(scout.position, { x: -288, y: 816, z: 0 });
      assert.ok(water.has("26,7"), "coast objective remains shore-adjacent to the naval channel");
      const blocked = new Set(
        variant.presetWorld.terrainPatches.filter((patch) => patch.blocked).map((patch) => `${patch.x},${patch.y}`)
      );
      for (let y = 0; y <= 49; y++) {
        assert.ok(blocked.has(`23,${y}`), `coast: western ground barrier has a gap at 23,${y}`);
        assert.ok(blocked.has(`32,${y}`), `coast: eastern ground barrier has a gap at 32,${y}`);
        assert.ok(water.has(`28,${y}`), `coast: water channel has a gap at 28,${y}`);
      }
    }
    assert.equal(
      variant.presetWorld.actors.some((actor) => actor.fixtureActorId === "escort-carrier"),
      branch === "escort"
    );
    assert.equal(
      variant.presetWorld.controls.some((control) => control.id === "escort-unload"),
      branch === "escort"
    );
    if (branch === "escort") {
      assert.equal(variant.presetWorld.controls.find((control) => control.id === "escort-unload").applicationTick, 800);
      assert.ok(variant.presetWorld.controls.some((control) => control.id === "escort-retreat"));
    }
    if (["intercept", "escort"].includes(branch)) {
      assert.equal(
        variant.additionalAiPlayers?.some((player) => player.playerNumber === 3),
        true
      );
      assert.ok(variant.presetWorld.existingActorBindings.some((actor) => actor.fixtureActorId === "third-home"));
    } else {
      assert.equal(Boolean(variant.additionalAiPlayers?.some((player) => player.playerNumber === 3)), false);
      assert.equal(
        variant.presetWorld.existingActorBindings.some((actor) => actor.fixtureActorId === "third-home"),
        false
      );
    }
  }
});
