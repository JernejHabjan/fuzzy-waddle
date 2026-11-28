import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";
import { tile } from "../../worlds/native-world-geometry.ts";

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
