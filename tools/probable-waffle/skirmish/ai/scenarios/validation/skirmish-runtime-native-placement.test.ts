import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioFixture } from "../registration/native-scenario-registration.ts";

test("PLACE-03 transit probes finish before the AI refreshes their orders", () => {
  const fixture = nativeScenarioFixture("PLACE-03"),
    variants = fixture.recipe.variants;
  assert.equal(variants.length, 8);
  for (const variant of variants) {
    for (const role of ["worker-transit", "army-transit"])
      assert.equal(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === role)?.owner, 2);
    assert.equal(
      variant.presetWorld.controls.filter((control) =>
        ["worker-transit", "army-transit"].includes(control.producerFixtureActorId)
      ).length,
      2
    );
    assert.ok(
      variant.presetWorld.controls
        .filter((control) => ["worker-transit", "army-transit"].includes(control.producerFixtureActorId))
        .every((control) => control.requestTick === 1)
    );
    assert.equal(
      variant.presetWorld.controls.find((control) => control.producerFixtureActorId === "worker-transit")?.action
        .worldPosition.x,
      0
    );
    const armyTarget = variant.presetWorld.controls.find((control) => control.producerFixtureActorId === "army-transit")
      ?.action.worldPosition;
    assert.deepEqual(
      armyTarget,
      variant.id.endsWith("-concurrent") ? { x: 160, y: 848, z: 0 } : { x: 128, y: 864, z: 0 }
    );
  }
});

test("PLACE-03 protected routes preserve one-tile transit rather than requiring a three-wide corridor", () => {
  const fixture = nativeScenarioFixture("PLACE-03");
  for (const variant of fixture.recipe.variants) {
    const routes = variant.presetWorld.protectedRoutes;
    assert.ok(routes?.length);
    assert.ok(routes.filter((route) => route.id !== "worker-service").every((route) => route.tileMargin === 0));
  }
  for (const variant of fixture.recipe.variants.filter((candidate) => candidate.id.endsWith("-layout"))) {
    const retreat = variant.presetWorld.protectedRoutes.find((route) => route.id === "retreat");
    assert.deepEqual(retreat?.from, { x: 32, y: 912 });
    assert.deepEqual(retreat?.to, { x: 192, y: 992 });
  }
});

test("PLACE-03 completion binds its army-clearance route to the real transit order", () => {
  const fixture = nativeScenarioFixture("PLACE-03");
  for (const variant of fixture.recipe.variants.filter((candidate) => candidate.id.endsWith("-completion"))) {
    const route = variant.presetWorld.protectedRoutes.find((candidate) => candidate.id === "army-transit");
    const actor = variant.presetWorld.actors.find((candidate) => candidate.fixtureActorId === "army-transit");
    const order = variant.presetWorld.controls.find((candidate) => candidate.producerFixtureActorId === "army-transit");

    assert.ok(route);
    assert.ok(actor);
    assert.ok(order);
    assert.equal(order.requestTick, 1);
    assert.deepEqual(route.from, { x: actor.position.x, y: actor.position.y });
    assert.equal(order.action.kind, "move");
    assert.deepEqual(route.to, { x: order.action.worldPosition.x, y: order.action.worldPosition.y });
  }
});

test("PLACE-01 uses one-tile clearance and early physical transit probes", () => {
  const fixture = nativeScenarioFixture("PLACE-01");
  for (const variant of fixture.recipe.variants) {
    const routes = variant.presetWorld.protectedRoutes;
    assert.ok(routes?.length);
    assert.ok(routes.filter((route) => route.id !== "worker-service").every((route) => route.tileMargin === 0));
    const controls = variant.presetWorld.controls.filter(
      (control) =>
        ["worker-transit", "army-transit"].includes(control.producerFixtureActorId) && control.action.kind === "move"
    );
    assert.equal(controls.length, 2);
    assert.ok(controls.every((control) => control.requestTick === 1 && control.applicationTick === 1));
  }
});

test("RAID-01 remote expansion fixture staffs the actual raid deposit", () => {
  const fixture = nativeScenarioFixture("RAID-01");
  for (const [faction, expectedContact] of [
    ["tivara", "SkaduweeWarriorMale"],
    ["skaduwee", "TivaraMacemanMale"]
  ] as const) {
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === `raid-01-${faction}-expansion`);
    assert.ok(variant);
    const actors = new Map(variant.presetWorld.actors.map((actor) => [actor.fixtureActorId, actor]));
    assert.equal(actors.get("contact-group")?.actorName, "Wall");
    assert.deepEqual(actors.get("enemy-deposit")?.position, { x: -736, y: 784, z: 0 });
    assert.deepEqual(actors.get("enemy-worker")?.position, { x: -736, y: 848, z: 0 });
    assert.deepEqual(actors.get("enemy-source")?.position, { x: -832, y: 896, z: 0 });
    assert.equal(actors.get("noise-scout")?.actorName, expectedContact);
    assert.ok(
      variant.presetWorld.initialOrders.some(
        (order) =>
          order.workerFixtureActorId === "enemy-worker" &&
          order.sourceFixtureActorId === "enemy-source" &&
          order.kind === "gather"
      )
    );
  }
});

test("WALL-01 probes the protected route early and terrain chokes fund the bounded graph", () => {
  const fixture = nativeScenarioFixture("WALL-01");
  assert.equal(fixture.recipe.variants.length, 6);
  for (const variant of fixture.recipe.variants) {
    const transits = variant.presetWorld.controls.filter((control) =>
      ["worker-transit", "army-transit"].includes(control.producerFixtureActorId)
    );
    assert.equal(transits.length, 2);
    assert.ok(transits.every((control) => control.requestTick === 1 && control.applicationTick === 1));
    assert.deepEqual(
      transits.find((control) => control.producerFixtureActorId === "army-transit")?.action.worldPosition,
      { x: 128, y: 864, z: 0 }
    );
  }
  for (const variant of fixture.recipe.variants.filter((candidate) => candidate.id.includes("terrain"))) {
    assert.equal(
      variant.presetWorld.actors.some((actor) =>
        ["perimeter-stair", "perimeter-wall", "perimeter-wall-2"].includes(actor.fixtureActorId)
      ),
      false
    );
    const blocked = new Set(
      variant.presetWorld.terrainPatches.filter((patch) => patch.blocked).map((patch) => `${patch.x},${patch.y}`)
    );
    assert.ok(blocked.has("29,12"), `${variant.id}: missing north cliff anchor`);
    assert.ok(blocked.has("29,22"), `${variant.id}: missing south cliff anchor`);
    const aiStart = variant.presetWorld.resourceStarts.find(
      (start) => start.playerNumber === fixture.recipe.aiPlayerNumber
    );
    assert.ok(aiStart);
    // Eight wall-line nodes plus two stairs cost at most 700 stone; the standard 20% ceiling can fund that prefix.
    assert.ok(aiStart.amounts.stone >= 3500, `${variant.id}: insufficient stone for the bounded 700-stone graph`);
    const housing = variant.presetWorld.actors.filter((actor) =>
      ["ready-house", "fortification-house-1", "fortification-house-2"].includes(actor.fixtureActorId)
    );
    assert.equal(housing.length, 3, `${variant.id}: essential housing buffer must not suppress optional fortification`);
    assert.deepEqual(housing.map(({ fixtureActorId }) => fixtureActorId).sort(), [
      "fortification-house-1",
      "fortification-house-2",
      "ready-house"
    ]);
  }
});
