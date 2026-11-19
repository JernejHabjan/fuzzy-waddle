import assert from "node:assert/strict";
import { test } from "node:test";
import { tile } from "../../worlds/native-world-geometry.ts";
import { nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";

test("PLACE-03 has separate opening and post-layout probes on the protected routes", () => {
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
      6
    );
    const coordinates = (value: { x: number; y: number }) => [value.x, value.y];
    const routes = variant.presetWorld.protectedRoutes;
    for (const [role, route] of [
      ["worker-transit", routes[0]],
      ["army-transit", routes[1]]
    ] as const) {
      const stage = variant.presetWorld.controls.find((control) => control.id === "post-layout-stage-" + role);
      const cross = variant.presetWorld.controls.find((control) => control.id === "post-layout-cross-" + role);
      assert.ok(stage?.action.worldPosition && cross?.action.worldPosition);
      assert.ok(stage.applicationTick > 1 && cross.applicationTick > stage.applicationTick);
      assert.ok(fixture.recipe.checkpointTicks.some((tick) => tick > cross.applicationTick));
      assert.deepEqual(coordinates(stage.action.worldPosition), coordinates(route.from));
      assert.deepEqual(coordinates(cross.action.worldPosition), coordinates(route.to));
    }
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
    if (variant.id.endsWith("-constrained")) {
      const world = variant.presetWorld;
      const service = routes.find((route) => route.id === "worker-service");
      const worker = world.actors.find((actor) => actor.fixtureActorId === "worker-transit");
      const order = controls.find((control) => control.producerFixtureActorId === "worker-transit");
      assert.ok(service && worker && order);
      assert.deepEqual({ ...service.from, z: 0 }, worker.position);
      assert.deepEqual({ ...service.to, z: 0 }, order.action.worldPosition);
      for (let y = 27; y <= 30; y++)
        assert.ok(!world.terrainPatches.some((patch) => patch.x === 34 && patch.y === y && patch.blocked));
      const { x, y } = tile(34, 27);
      assert.deepEqual(service.to, { x, y });
    }
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

test("WALL-02 retains rally routes while transit probes cross the intentional opening", () => {
  const fixture = nativeScenarioFixture("WALL-02");
  assert.equal(fixture.recipe.variants.length, 8);
  for (const faction of ["Tivara", "Skaduwee"]) {
    const sameMatchVariants = fixture.recipe.variants.filter((variant) => variant.id.includes(faction.toLowerCase()));
    assert.equal(new Set(sameMatchVariants.map((variant) => variant.presetWorld.fixtureId)).size, 1);
  }
  for (const variant of fixture.recipe.variants) {
    const armyRoute = variant.presetWorld.protectedRoutes.find((route) => route.id === "production-army");
    const retreat = variant.presetWorld.protectedRoutes.find((route) => route.id === "retreat");
    assert.ok(armyRoute);
    assert.ok(retreat);
    assert.equal(armyRoute.tileMargin, 1);
    assert.deepEqual(armyRoute.from, { x: 320, y: 832 });
    assert.deepEqual(armyRoute.to, { x: 192, y: 768 });
    assert.deepEqual(retreat.from, { x: 192, y: 768 });
    assert.deepEqual(retreat.to, { x: 320, y: 832 });

    const transits = variant.presetWorld.controls.filter(
      (control) =>
        ["worker-transit", "army-transit"].includes(control.producerFixtureActorId) && control.action.kind === "move"
    );
    const expectedRoles = variant.id.includes("-worker")
      ? ["worker-transit"]
      : variant.id.includes("-army")
        ? ["army-transit"]
        : variant.id.includes("-concurrent")
          ? ["worker-transit", "army-transit"]
          : [];
    assert.deepEqual(
      [...new Set(transits.map((control) => control.producerFixtureActorId))].sort(),
      [...expectedRoles].sort(),
      `${variant.id}: controls must match the branch obligation`
    );
    assert.equal(
      transits.length,
      expectedRoles.reduce((count, role) => count + (role === "army-transit" ? 1 : 4), 0)
    );
    assert.ok(transits.every((control) => [768, 800].includes(control.action.worldPosition.y)));
    assert.deepEqual(
      [...new Set(transits.map((control) => control.applicationTick))].sort((left, right) => left - right),
      expectedRoles.includes("worker-transit")
        ? [1041, 1398, 1641, 2363]
        : expectedRoles.includes("army-transit")
          ? [1041]
          : []
    );
    for (const role of expectedRoles) {
      const positions = transits
        .filter((control) => control.producerFixtureActorId === role)
        .map((control) => (control.action.kind === "move" ? control.action.worldPosition.x : null));
      assert.equal(
        new Set(positions).size,
        role === "worker-transit" ? 2 : 1,
        `${variant.id}/${role}: transit probes must match the branch obligation`
      );
    }
    const hostileControls = variant.presetWorld.controls;
    assert.equal(
      hostileControls.some((control) => control.id === "move-contact-group-1" && control.action.kind === "move"),
      variant.id.includes("-enemy-opening"),
      `${variant.id}: pressure setup must be branch-scoped`
    );
    assert.equal(
      hostileControls.some((control) => control.id === "attack-contact-group-200" && control.action.kind === "attack"),
      variant.id.includes("-enemy-opening"),
      `${variant.id}: pressure setup must be branch-scoped`
    );
    assert.equal(
      hostileControls.some((control) => control.id === "move-hostile-transit-1720" && control.action.kind === "move") &&
        hostileControls.some(
          (control) => control.id === "attack-hostile-transit-2010" && control.action.kind === "attack"
        ),
      variant.id.includes("-enemy-opening"),
      `${variant.id}: staged hostile post-wall attack must be branch-scoped`
    );
    assert.equal(
      hostileControls.filter((control) => control.producerFixtureActorId?.startsWith("opening-pressure-")).length,
      variant.id === "wall-02-skaduwee-enemy-opening" ? 8 : 0,
      `${variant.id}: stronger approach pressure is limited to the paired Skaduwee branch`
    );
    if (variant.id.includes("-enemy-opening")) {
      const hostileStage = hostileControls.find((control) => control.id === "move-hostile-transit-1720");
      const enemySideRoute = variant.presetWorld.protectedRoutes.find((route) => route.id === "production-army");
      assert.deepEqual(
        hostileStage?.action.kind === "move"
          ? { x: hostileStage.action.worldPosition.x, y: hostileStage.action.worldPosition.y }
          : undefined,
        enemySideRoute ? { x: enemySideRoute.to.x, y: enemySideRoute.to.y } : undefined,
        `${variant.id}: hostile probe must stage at the outside end of the preserved access route`
      );
    }
  }
});
