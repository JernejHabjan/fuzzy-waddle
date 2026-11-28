import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { nativeScenarioBindings, nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";
import { readNativeScenarioFixture } from "../../registration/read-native-scenario-fixture.ts";
import { validNativeScenarioFixture } from "../skirmish-runtime-native-scenario-fixture.ts";
import { producer, tile } from "../../worlds/native-scenario-worlds.ts";

test("all native bindings retain their full branches and original acceptance obligations", () => {
  const ids = Object.keys(nativeScenarioBindings.cases);
  assert.equal(ids.length, 85);
  const manifest = JSON.parse(
    readFileSync(new URL("../../../testing/fixtures/skirmish-scenario-manifest.json", import.meta.url), "utf8")
  );
  for (const id of ids) {
    const row = manifest.rows.find((row) => row.id === id);
    assert.ok(row.fixture.startsWith("native/"));
    assert.ok(row.fixture.includes(`/${id.toLowerCase()}-`));
    assert.equal(row.runtimeRecipeDraft, undefined);
    const fixture = readNativeScenarioFixture(
      fileURLToPath(new URL("../../../testing/fixtures/", import.meta.url)),
      row.fixture
    );
    assert.equal(validNativeScenarioFixture(fixture, id), true);
    assert.ok(fixture.acceptance.required.length > 0);
    assert.ok(fixture.acceptance.forbidden.length > 0);
    assert.equal(fixture.status, "authored_not_executed");
  }
});

test("C-04 keeps only the real scouting decision roster and bounds its repeated-observation window", () => {
  const fixture = nativeScenarioFixture("C-04"),
    binding = nativeScenarioBindings.cases["C-04"];
  assert.equal(binding.latestTick, 1000);
  assert.deepEqual(binding.evidenceCheckpoints, [200, 400, 800]);
  assert.deepEqual(binding.evidenceCheckpointBranches, ["answered", "repeated", "distinct", "irrelevant"]);
  for (const variant of fixture.recipe.variants) {
    assert.ok(variant.presetWorld.actors.length <= 12);
    const actorRoles = new Set(variant.presetWorld.actors.map((actor) => actor.fixtureActorId));
    assert.ok(variant.presetWorld.initialOrders.every((order) => actorRoles.has(order.workerFixtureActorId)));
    assert.equal(
      variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "scout-probe")?.actorName,
      variant.aiFaction === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl"
    );
    assert.equal(actorRoles.has("distinct-contact"), variant.id.includes("-distinct"));
    const contact = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group");
    assert.equal(
      contact?.actorName,
      variant.id.includes("-irrelevant")
        ? `${variant.aiFaction === "Tivara" ? "Skaduwee" : "Tivara"}WorkerMale`
        : producer(variant.aiFaction === "Tivara" ? "Skaduwee" : "Tivara")
    );
    assert.deepEqual(contact?.position, variant.id.includes("-repeated") ? tile(23, 28) : tile(12, 28));
  }
});

test("C-05 isolates bait pursuit, real defenders, danger and post-battle targets", () => {
  const fixture = nativeScenarioFixture("C-05"),
    binding = nativeScenarioBindings.cases["C-05"];
  assert.equal(binding.latestTick, 1100);
  for (const variant of fixture.recipe.variants) {
    const roles = new Set(variant.presetWorld.actors.map((actor) => actor.fixtureActorId));
    assert.ok(variant.presetWorld.actors.length <= 27, `${variant.id}: remove unrelated match actors`);
    assert.equal(Array.from({ length: 8 }, (_, index) => roles.has(`army-${index}`)).every(Boolean), true);
    assert.equal(roles.has("contact-group"), true);
    assert.equal(roles.has("own-deposit"), true);
    assert.equal(roles.has("front-target-a"), true);
    assert.equal(roles.has("front-target-b"), false);
    assert.equal(
      variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "front-target-a")?.actorName,
      variant.aiFaction === "Tivara" ? "FrostForge" : "Sandhold"
    );
    assert.deepEqual(
      variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "front-target-a")?.position,
      tile(13, 12)
    );
    assert.equal(
      [...roles].filter((role) => role.startsWith("pursuit-danger-")).length,
      variant.id.includes("-unsafe") ? 6 : variant.id.includes("-bait") || variant.id.includes("-valuable") ? 1 : 0
    );
    for (
      let index = 0;
      index <
      (variant.id.includes("-unsafe") ? 6 : variant.id.includes("-bait") || variant.id.includes("-valuable") ? 1 : 0);
      index++
    )
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === `pursuit-danger-${index}`)?.position,
        tile(20 - (index % 3) * 4, 18 + Math.floor(index / 3) * 4)
      );
    assert.ok(variant.presetWorld.controls.some((control) => control.id === "bait-attack"));
    assert.equal(
      variant.presetWorld.controls.some((control) => control.id === "bait-retreat"),
      variant.id.includes("-bait") || variant.id.includes("-valuable")
    );
  }
});
