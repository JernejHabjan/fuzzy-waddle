import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";
import { tile } from "../../worlds/native-scenario-worlds.ts";

test("H-14 keeps a reachable scouting route and affordable production demand beside harmless noise", () => {
  const fixture = nativeScenarioFixture("H-14");
  for (const variant of fixture.recipe.variants) {
    const world = variant.presetWorld;
    assert.deepEqual(world.actors.find((actor) => actor.fixtureActorId === "scout-probe").position, {
      x: 224,
      y: 752,
      z: 0
    });
    assert.equal(world.actors.filter((actor) => /^army-\d+$/.test(actor.fixtureActorId)).length, 2);
    assert.ok(world.actors.some((actor) => actor.fixtureActorId === "ready-producer"));
    assert.ok(world.actors.some((actor) => actor.fixtureActorId === "harmless-scout"));
  }
});

test("SCOUT-03 starts focused escape and trapped probes against a hidden contact", () => {
  const fixture = nativeScenarioFixture("SCOUT-03"),
    binding = fixture.assertions["SCOUT-03"].requiredNativeScenario;
  assert.equal(binding.latestTick, 1000);
  for (const variant of fixture.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    const ownScout = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "scout-probe");
    const pursuer = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group");
    assert.deepEqual(pursuer?.position, tile(20, 35));
    assert.deepEqual(ownScout?.position, tile(27, 35));
    assert.ok(variant.presetWorld.actors.some((actor) => actor.fixtureActorId === "scout-guard"));
    assert.equal(
      ownScout?.actorName,
      branch === "escape"
        ? variant.aiFaction === "Tivara"
          ? "TivaraAlchemist"
          : "SkaduweeOwl"
        : variant.aiFaction === "Tivara"
          ? "TivaraMacemanMale"
          : "SkaduweeWarriorMale"
    );
    assert.equal(pursuer?.actorName, variant.aiFaction === "Tivara" ? "SkaduweeRangedFemale" : "TivaraSlingshotFemale");
    assert.equal(
      variant.presetWorld.actors.some((actor) => actor.fixtureActorId === "ready-producer"),
      false
    );
    assert.deepEqual(variant.presetWorld.resourceStarts.find((entry) => entry.playerNumber === 2)?.amounts, {
      food: 0,
      minerals: 0,
      stone: 0,
      wood: 0
    });
    assert.ok(
      variant.presetWorld.controls.some(
        (control) => control.id === `attack-contact-group-${branch === "escape" ? 80 : 40}`
      )
    );
  }
});

test("SCOUT-02 opens with visible contact outside the probe's attack radius", () => {
  const fixture = nativeScenarioFixture("SCOUT-02");
  for (const variant of fixture.recipe.variants) {
    const probe = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "scout-probe");
    const rangedProbe = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "ranged-probe");
    const supportProbe = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "support-probe");
    const contact = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group");
    assert.deepEqual(probe?.position, { ...tile(44, 7) });
    assert.deepEqual(rangedProbe?.position, { ...tile(42, 5) });
    assert.deepEqual(supportProbe?.position, { ...tile(44, 5) });
    assert.deepEqual(contact?.position, { ...tile(45, 20) });
  }
});

test("scouting captures combat history only where it proves the hidden-health mutation", () => {
  for (const id of ["SCOUT-01", "SCOUT-02"]) {
    const fixture = nativeScenarioFixture(id);
    const binding = fixture.assertions[id].requiredNativeScenario;
    for (const variant of fixture.recipe.variants) {
      assert.equal(variant.captureConstruction, true);
      assert.equal(variant.captureCombat, binding.branchByVariant[variant.id] === "hidden_health" ? true : undefined);
    }
  }
});

test("SCOUT-01 retains both hidden starts and one scout without inherited combat probes", () => {
  const fixture = nativeScenarioFixture("SCOUT-01");
  assert.equal(fixture.assertions["SCOUT-01"].requiredNativeScenario.latestTick, 620);
  for (const faction of ["Tivara", "Skaduwee"]) {
    const variants = fixture.recipe.variants.filter((entry) => entry.aiFaction === faction);
    assert.equal(variants.length, 2);
    assert.equal(variants[0].presetWorld.fixtureId, variants[1].presetWorld.fixtureId);
    const contacts = variants.map((variant) => {
      const roles = variant.presetWorld.actors.map((actor) => actor.fixtureActorId);
      assert.ok(roles.includes("scout-probe"));
      assert.ok(roles.includes("own-source") && roles.includes("enemy-source"));
      const scout = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "scout-probe");
      assert.deepEqual(scout?.position, tile(30, 24));
      assert.equal(scout?.actorName, faction === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl");
      assert.equal(roles.filter((role) => /^worker-\d+$/.test(role)).length, 1);
      assert.deepEqual(variant.presetWorld.resourceStarts.find((entry) => entry.playerNumber === 2)?.amounts, {
        food: 300,
        wood: 0,
        stone: 0,
        minerals: 0
      });
      assert.ok(!roles.some((role) => role.startsWith("army-")));
      assert.ok(!roles.includes("ranged-probe") && !roles.includes("front-target-a"));
      return variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position;
    });
    assert.deepEqual(contacts, [tile(6, 18), tile(8, 18)]);
    assert.ok(
      variants.every(
        (variant) => !variant.presetWorld.actors.some((actor) => actor.fixtureActorId === "enemy-producer")
      )
    );
    assert.ok(contacts.every((contact) => Math.hypot(contact.x - tile(30, 24).x, contact.y - tile(30, 24).y) > 8));
  }
});

test("SCOUT-04 isolates three native scouting responses in a bounded six-variant recipe", () => {
  const fixture = nativeScenarioFixture("SCOUT-04"),
    binding = fixture.assertions["SCOUT-04"].requiredNativeScenario;
  assert.equal(binding.latestTick, 1000);
  for (const variant of fixture.recipe.variants) {
    const branch = binding.branchByVariant[variant.id],
      roles = variant.presetWorld.actors.map((actor) => actor.fixtureActorId),
      contact = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group");
    assert.equal(roles.filter((role) => /^worker-\d+$/.test(role)).length, 1, variant.id);
    assert.ok(roles.includes("scout-probe") && contact, variant.id);
    assert.deepEqual(variant.presetWorld.resourceStarts.find((entry) => entry.playerNumber === 2)?.amounts, {
      food: 300,
      wood: 0,
      stone: 0,
      minerals: 0
    });
    assert.deepEqual(contact.position, branch === "approach" ? tile(13, 35) : tile(14, 7), variant.id);
    assert.equal(roles.includes("scout-reserve"), branch !== "approach", variant.id);
    assert.equal(roles.includes("scout-reserve-2"), branch !== "approach", variant.id);
    assert.ok(!roles.some((role) => role.startsWith("army-") || role.startsWith("enemy-")), variant.id);
    assert.equal(variant.presetWorld.terrainPatches.length, branch === "approach" ? 92 : 0, variant.id);
  }
});

test("SCOUT-02 hidden branches withdraw beyond the AI army while preserving an independent position mutation", () => {
  const fixture = nativeScenarioFixture("SCOUT-02");
  for (const variant of fixture.recipe.variants.filter(
    (entry) => entry.id.includes("withdrawn") || entry.id.includes("hidden-")
  )) {
    assert.equal(
      variant.presetWorld.fixtureId,
      `scout-02-${variant.aiFaction.toLowerCase()}-withdrawal-pair`,
      variant.id
    );
    const control = variant.presetWorld.controls.find((entry) => entry.id === "move-contact-group-20");
    const arrivalRetreat = variant.presetWorld.controls.find((entry) => entry.id === "move-contact-group-200");
    const pursuitRetreat = variant.presetWorld.controls.find((entry) => entry.id === "move-contact-group-320");
    const staleWindowRetreat = variant.presetWorld.controls.find((entry) => entry.id === "move-contact-group-600");
    const expected =
      variant.aiFaction === "Skaduwee"
        ? variant.id.includes("hidden-position")
          ? tile(48, 48)
          : tile(44, 44)
        : variant.id.includes("hidden-position")
          ? tile(48, 48)
          : tile(45, 45);
    assert.deepEqual(control?.action.worldPosition, { ...expected }, variant.id);
    assert.deepEqual(arrivalRetreat?.action.worldPosition, { ...expected }, variant.id);
    assert.deepEqual(pursuitRetreat?.action.worldPosition, { ...expected }, variant.id);
    assert.deepEqual(staleWindowRetreat?.action.worldPosition, { ...expected }, variant.id);
  }
});
