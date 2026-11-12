import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioFixture } from "../registration/native-scenario-registration.ts";
import { tile } from "../worlds/native-scenario-worlds.ts";

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

test("SCOUT-03 escape starts with a hidden contact and a real discoverer", () => {
  const fixture = nativeScenarioFixture("SCOUT-03"),
    binding = fixture.assertions["SCOUT-03"].requiredNativeScenario;
  for (const variant of fixture.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    if (branch !== "escape") continue;
    assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position, {
      x: -480,
      y: 528,
      z: 0
    });
    assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "scout-probe")?.position, {
      x: 64,
      y: 800,
      z: 0
    });
    const ownScout = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "scout-probe");
    const pursuer = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group");
    assert.equal(ownScout?.actorName, variant.aiFaction === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl");
    assert.equal(pursuer?.actorName, variant.aiFaction === "Tivara" ? "SkaduweeRangedFemale" : "TivaraSlingshotFemale");
    assert.ok(variant.presetWorld.controls.some((control) => control.id === "attack-contact-group-200"));
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
