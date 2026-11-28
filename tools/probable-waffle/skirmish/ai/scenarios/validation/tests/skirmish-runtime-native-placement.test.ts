import assert from "node:assert/strict";
import { test } from "node:test";
import { tile } from "../../worlds/native-world-geometry.ts";
import { nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";

test("PLACE-03 layout branch keeps the worker-service route active through the measured build prefix", () => {
  const fixture = nativeScenarioFixture("PLACE-03"),
    variants = fixture.recipe.variants;
  assert.equal(variants.length, 8);
  assert.equal(fixture.assertions["PLACE-03"].maximumTick, 2000);
  const coordinates = (value: { x: number; y: number }) => [value.x, value.y];
  for (const variant of variants) {
    assert.equal(variant.presetWorld.actors.filter((actor) => /^worker-\d+$/.test(actor.fixtureActorId)).length, 4);
    assert.deepEqual(variant.presetWorld.resourceStarts.find((start) => start.playerNumber === 2)?.amounts, {
      food: 350,
      wood: 600,
      stone: 200,
      minerals: 0
    });
    assert.deepEqual(
      variant.presetWorld.actors
        .filter((actor) => actor.owner === 1)
        .map((actor) => actor.fixtureActorId)
        .sort(),
      ["army-transit", "worker-transit"].sort()
    );
    const scoutProbe = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "scout-probe");
    if (variant.id.endsWith("-layout")) assert.deepEqual(scoutProbe?.position, tile(21, 31));
    else assert.equal(scoutProbe?.owner, 2);
    const readyFields = variant.presetWorld.actors.filter((actor) => /^ready-field-\d+$/.test(actor.fixtureActorId));
    assert.equal(readyFields.length, variant.id.endsWith("-layout") ? 3 : 0);
    if (variant.id.endsWith("-layout"))
      assert.deepEqual(
        readyFields.map((actor) => coordinates(actor.position)),
        [coordinates(tile(37, 33)), coordinates(tile(42, 33)), coordinates(tile(32, 34))]
      );
    assert.equal(
      variant.presetWorld.events.some(
        (event) => event.kind === "destroy_owned_actor" && event.owner === 1 && event.tick === 1
      ),
      variant.id.includes("tivara")
    );
    for (const role of ["worker-transit", "army-transit"])
      assert.equal(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === role)?.owner, 1);
    const routeControls = variant.presetWorld.controls.filter((control) =>
      ["worker-transit", "army-transit"].includes(control.producerFixtureActorId)
    );
    const layout = variant.id.endsWith("-layout");
    const workerOnlyTransit = layout || variant.id.endsWith("-concurrent");
    assert.equal(routeControls.length, workerOnlyTransit ? 1 : 2);
    if (layout) {
      const workerRouteOrders = variant.presetWorld.controls.filter((control) =>
        control.id.startsWith("move-scout-probe-")
      );
      assert.deepEqual(
        workerRouteOrders.map((control) => [control.applicationTick, coordinates(control.action.worldPosition)]),
        (variant.id.includes("skaduwee") ? [10, 315, 435, 635, 1115] : [10, 115, 315, 635, 1115]).map((tick) => [
          tick,
          coordinates(tile(45, 29))
        ])
      );
      assert.deepEqual(
        variant.presetWorld.protectedRoutes?.slice(0, 2).map(({ id, from, to }) => ({
          id,
          from: coordinates(from),
          to: coordinates(to)
        })),
        [
          { id: "worker-service", from: coordinates(tile(21, 31)), to: coordinates(tile(45, 29)) },
          { id: "production-army", from: coordinates(tile(17, 14)), to: coordinates(tile(41, 25)) }
        ]
      );
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "worker-transit")?.position,
        tile(20, 30)
      );
      assert.deepEqual(
        routeControls.map(({ id, requestTick }) => [id, requestTick]),
        [["post-layout-cross-worker-transit", variant.id.includes("skaduwee") ? 500 : 1400]]
      );
    }
    if (variant.id.endsWith("-concurrent"))
      assert.deepEqual(
        routeControls.map(({ id, requestTick }) => [id, requestTick]),
        [["post-layout-cross-worker-transit", 1470]]
      );
    const routes = variant.presetWorld.protectedRoutes;
    if (variant.id.includes("place-03") && !layout)
      assert.deepEqual(coordinates(routes[0].to), coordinates(tile(29, 31)));
    for (const [role, route] of [
      ["worker-transit", routes[0]],
      ["army-transit", routes[1]]
    ] as const) {
      const cross = variant.presetWorld.controls.find((control) => control.id === "post-layout-cross-" + role);
      if (workerOnlyTransit && role === "army-transit") continue;
      assert.ok(cross?.action.worldPosition);
      if (layout)
        assert.deepEqual(
          coordinates(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === role)!.position),
          coordinates(tile(20, 30))
        );
      else {
        assert.ok(cross.applicationTick > 1);
        assert.equal(cross.applicationTick, role === "worker-transit" ? 1470 : 1505);
      }
      assert.ok(cross.applicationTick > 1);
      assert.ok(fixture.recipe.checkpointTicks.some((tick) => tick > cross.applicationTick));
      assert.deepEqual(coordinates(cross.action.worldPosition), coordinates(route.to));
    }
    const workerTarget = variant.presetWorld.controls.find(
        (control) => control.id === "post-layout-cross-worker-transit"
      )?.action.worldPosition,
      armyTarget = variant.presetWorld.controls.find((control) => control.id === "post-layout-cross-army-transit")
        ?.action.worldPosition;
    assert.deepEqual(coordinates(workerTarget), coordinates(routes[0].to));
    if (!workerOnlyTransit) assert.deepEqual(coordinates(armyTarget), coordinates(routes[1].to));
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
    assert.deepEqual(retreat?.from, { x: tile(41, 25).x, y: tile(41, 25).y });
    assert.deepEqual(retreat?.to, { x: tile(16, 13).x, y: tile(16, 13).y });
  }
  for (const variant of fixture.recipe.variants.filter((candidate) => !candidate.id.endsWith("-layout"))) {
    const completion = variant.id.endsWith("-completion"),
      earlyBuilds = variant.id.includes("skaduwee"),
      concurrent = variant.id.endsWith("-concurrent"),
      ticks = earlyBuilds ? (concurrent ? [10, 50] : [10, 50, 110]) : [115, 315],
      actor = variant.presetWorld.actors.find((candidate) => candidate.fixtureActorId === "scout-probe"),
      route = variant.presetWorld.protectedRoutes.find((candidate) =>
        completion ? candidate.id === "retreat" : candidate.id === "production-army"
      ),
      controls = ticks.map((tick) =>
        variant.presetWorld.controls.find((candidate) => candidate.id === `move-scout-probe-${tick}`)
      );
    assert.ok(actor);
    assert.equal(actor.owner, 2);
    assert.deepEqual(actor.position, completion ? tile(26, 24) : tile(41, 24));
    assert.ok(route);
    assert.ok(controls.every((control) => control));
    assert.deepEqual(
      controls.map((control) => control?.applicationTick),
      ticks
    );
    assert.deepEqual(
      controls.map((control) => [control?.action.worldPosition.x, control?.action.worldPosition.y]),
      (completion
        ? earlyBuilds
          ? [tile(33, 25), tile(28, 25), tile(33, 25)]
          : [tile(33, 25), tile(28, 25)]
        : concurrent
          ? earlyBuilds
            ? [tile(27, 25), tile(27, 25)]
            : [tile(27, 25), tile(42, 25)]
          : earlyBuilds
            ? [tile(27, 25), tile(42, 25), tile(27, 25)]
            : [tile(27, 25), tile(42, 25)]
      ).map(({ x, y }) => [x, y])
    );
  }
});

test("PLACE-03 completion binds its army-clearance endpoint to the real transit order", () => {
  const fixture = nativeScenarioFixture("PLACE-03");
  for (const variant of fixture.recipe.variants.filter((candidate) => candidate.id.endsWith("-completion"))) {
    const route = variant.presetWorld.protectedRoutes.find((candidate) => candidate.id === "army-transit");
    const actor = variant.presetWorld.actors.find((candidate) => candidate.fixtureActorId === "army-transit");
    const cross = variant.presetWorld.controls.find((candidate) => candidate.id === "post-layout-cross-army-transit");

    assert.ok(route);
    assert.ok(actor);
    assert.equal(actor.owner, 1);
    assert.ok(cross);
    assert.deepEqual(route.to, { x: cross.action.worldPosition.x, y: cross.action.worldPosition.y });
  }
});

test("PLACE-02 holds the food budget and field geometry constant across both tower controls", () => {
  const { recipe } = nativeScenarioFixture("PLACE-02");
  for (const faction of ["tivara", "skaduwee"]) {
    const find = (branch: string) =>
      recipe.variants.find(({ id }) => id === "place-02-" + faction + "-" + branch)?.presetWorld;
    const base = find("safe"),
      outer = find("exposed"),
      both = find("both-exposed");
    assert.ok(base && outer && both);
    assert.deepEqual(outer.terrainPatches, base.terrainPatches);
    assert.deepEqual(both.terrainPatches, base.terrainPatches);
    assert.deepEqual(outer.resourceStarts, base.resourceStarts);
    assert.deepEqual(both.resourceStarts, base.resourceStarts);
    assert.deepEqual(
      outer.actors.filter(({ fixtureActorId }) => fixtureActorId !== "outer-threat"),
      base.actors
    );
    assert.deepEqual(
      both.actors.filter(({ fixtureActorId }) => fixtureActorId !== "inner-threat"),
      outer.actors
    );
    assert.equal(base.actors.filter(({ fixtureActorId }) => fixtureActorId.startsWith("worker-")).length, 4);
    assert.equal(base.protectedRoutes, undefined);
    assert.equal(base.controls?.length, 0);
    for (const x of [35, 41]) {
      for (let dx = -1; dx <= 1; dx++)
        for (let y = 27; y <= 29; y++)
          assert.ok(!base.terrainPatches.some((patch) => patch.x === x + dx && patch.y === y && patch.blocked));
    }
  }
});
