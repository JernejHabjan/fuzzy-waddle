import assert from "node:assert/strict";
import { test } from "node:test";
import { tile } from "../../worlds/native-world-geometry.ts";
import { nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";

test("PLACE-01 uses one-tile clearance and early physical transit probes", () => {
  const fixture = nativeScenarioFixture("PLACE-01"),
    coordinates = (value: { x: number; y: number }) => [value.x, value.y];
  assert.deepEqual(
    fixture.recipe.variants.map((variant) => variant.id),
    ["place-01-tivara-room", "place-01-tivara-constrained", "place-01-skaduwee-room", "place-01-skaduwee-constrained"]
  );
  assert.equal(fixture.assertions["PLACE-01"].maximumTick, 1000);
  for (const variant of fixture.recipe.variants) {
    const routes = variant.presetWorld.protectedRoutes;
    assert.ok(routes?.length);
    assert.equal(variant.presetWorld.actors.filter((actor) => /^worker-\d+$/.test(actor.fixtureActorId)).length, 6);
    assert.deepEqual(variant.presetWorld.resourceStarts.find((start) => start.playerNumber === 2)?.amounts, {
      food: 0,
      wood: 120,
      stone: 0,
      minerals: 0
    });
    assert.equal(
      variant.presetWorld.actors.some((actor) => actor.owner === 1),
      false
    );
    if (variant.id.endsWith("-room")) {
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "ready-granary")?.position,
        tile(42, 34)
      );
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "field-anchor")?.position,
        tile(38, 30)
      );
      assert.deepEqual(
        variant.presetWorld.initialOrders.find((order) => order.workerFixtureActorId === "worker-0"),
        { workerFixtureActorId: "worker-0", sourceFixtureActorId: "field-anchor", kind: "gather" }
      );
      if (variant.id.startsWith("place-01-")) {
        assert.deepEqual(
          variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "worker-0")?.position,
          tile(36, 30)
        );
        for (let index = 1; index < 3; index++)
          assert.deepEqual(
            variant.presetWorld.actors.find((actor) => actor.fixtureActorId === `worker-${index}`)?.position,
            tile(45 + (index % 3), 34 + Math.floor(index / 3))
          );
      }
      if (variant.id.startsWith("place-01-")) {
        assert.deepEqual(
          variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "ready-producer")?.position,
          tile(45, 40)
        );
        assert.deepEqual(
          variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "ready-house")?.position,
          tile(40, 40)
        );
      }
    }
    assert.equal(
      variant.presetWorld.events.some(
        (event) => event.kind === "destroy_owned_actor" && event.owner === 1 && event.tick === 1
      ),
      variant.id.includes("tivara")
    );
    assert.ok(routes.filter((route) => route.id !== "worker-service").every((route) => route.tileMargin === 0));
    if (variant.id.endsWith("-room")) {
      assert.deepEqual(
        routes.slice(0, 3).map(({ id, from, to }) => ({ id, from: coordinates(from), to: coordinates(to) })),
        [
          { id: "worker-service", from: coordinates(tile(42, 28)), to: coordinates(tile(43, 28)) },
          { id: "production-army", from: coordinates(tile(42, 25)), to: coordinates(tile(41, 25)) },
          { id: "retreat", from: coordinates(tile(41, 25)), to: coordinates(tile(42, 25)) }
        ]
      );
      for (const [centerX, centerY] of [
        [38, 30],
        [42, 30]
      ])
        for (let y = centerY - 2; y <= centerY + 2; y++)
          for (let x = centerX - 2; x <= centerX + 2; x++)
            assert.ok(
              !variant.presetWorld.terrainPatches.some((patch) => patch.x === x && patch.y === y && patch.blocked),
              `${variant.id}: aligned room plot blocked at ${x},${y}`
            );
      for (const [role, expected] of [
        ["worker-transit", tile(43, 28)],
        ["army-transit", tile(41, 25)]
      ] as const) {
        const move = variant.presetWorld.controls.find(
          (control) => control.producerFixtureActorId === role && control.action.kind === "move"
        );
        assert.ok(move?.action.kind === "move");
        assert.deepEqual(move.action.worldPosition, expected);
      }
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "worker-transit")?.position,
        tile(42, 28)
      );
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "army-transit")?.position,
        tile(42, 25)
      );
    }
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
        assert.ok(!world.terrainPatches.some((patch) => patch.x === 34 && patch.y === y - 1 && patch.blocked));
      const { x, y } = tile(35, 27);
      assert.deepEqual(service.to, { x, y });
      assert.deepEqual(world.actors.find((actor) => actor.fixtureActorId === "ready-granary")?.position, tile(38, 34));
      assert.deepEqual(world.actors.find((actor) => actor.fixtureActorId === "worker-4")?.position, tile(36, 32));
      assert.deepEqual(world.actors.find((actor) => actor.fixtureActorId === "worker-5")?.position, tile(35, 23));
      assert.ok(!world.terrainPatches.some((patch) => patch.x === 40 && patch.y === 26 && patch.blocked));
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
