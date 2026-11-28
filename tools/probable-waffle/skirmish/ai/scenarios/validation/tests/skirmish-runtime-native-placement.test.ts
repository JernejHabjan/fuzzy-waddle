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
      ["army-transit", ...(variant.id.endsWith("-layout") ? [] : ["worker-transit"])].sort()
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
      assert.equal(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === role)?.owner,
        role === "worker-transit" && variant.id.endsWith("-layout") ? 2 : 1
      );
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
        [["post-layout-cross-worker-transit", 1400]]
      );
    }
    if (variant.id.endsWith("-concurrent"))
      assert.deepEqual(
        routeControls.map(({ id, requestTick }) => [id, requestTick]),
        [["post-layout-cross-worker-transit", 1470]]
      );
    const routes = variant.presetWorld.protectedRoutes;
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

test("WALL-01 uses a focused route-and-fortification roster with a finite proof window", () => {
  const fixture = nativeScenarioFixture("WALL-01");
  assert.equal(fixture.recipe.variants.length, 6);
  assert.equal(fixture.assertions["WALL-01"].requiredNativeScenario.latestTick, 2000);
  for (const variant of fixture.recipe.variants) {
    const expectedRoles = [
      ...Array.from({ length: 3 }, (_, index) => `worker-${index}`),
      "ready-house",
      "ready-granary",
      "own-deposit",
      "own-source",
      "army-0",
      "protected-deposit",
      "worker-transit",
      "army-transit",
      "fortification-house-1",
      "fortification-house-2",
      "ready-field-1",
      "ready-field-2",
      ...(variant.id.includes("no-value") ? [] : ["enemy-producer", "wall-approach-probe"])
    ].sort();
    assert.deepEqual(variant.presetWorld.actors.map((actor) => actor.fixtureActorId).sort(), expectedRoles);
    assert.deepEqual(variant.presetWorld.resourceStarts.find((entry) => entry.playerNumber === 2)?.amounts, {
      food: 300,
      wood: 0,
      stone: 4000,
      minerals: 0
    });
    const transits = variant.presetWorld.controls.filter((control) =>
      ["worker-transit", "army-transit"].includes(control.producerFixtureActorId)
    );
    const opening = variant.id.includes("freestanding") ? { x: 38, y: 20 } : { x: 37, y: 20 };
    assert.equal(transits.length, 2);
    assert.ok(transits.every((control) => control.requestTick === 1 && control.applicationTick === 1));
    const armyRoute = variant.presetWorld.protectedRoutes.find((route) => route.id === "production-army");
    assert.deepEqual(
      transits.find((control) => control.producerFixtureActorId === "army-transit")?.action.worldPosition,
      armyRoute ? { ...armyRoute.to, z: 0 } : undefined,
      `${variant.id}: transit should follow the selected opening`
    );
    assert.deepEqual(
      variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "army-0")?.position,
      tile(32, 25),
      `${variant.id}: matched wall branches must keep the initial army position fixed`
    );
    assert.ok(
      variant.presetWorld.events.some(
        (event) =>
          event.kind === "destroy_owned_actor" &&
          event.owner === 1 &&
          event.tick === 1 &&
          event.objectName === (variant.id.includes("tivara") ? "SkaduweeMagicianFemale" : "TivaraMacemanMale")
      ),
      `${variant.id}: remove the unrelated default opponent threat`
    );
    if (!variant.id.includes("no-value")) {
      const probe = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "wall-approach-probe");
      const approachTicks = variant.id.includes("tivara-terrain")
        ? { move: 800, attack: 1120 }
        : variant.id.includes("tivara-freestanding")
          ? { move: 1100, attack: 1360 }
          : variant.id.includes("skaduwee-terrain")
            ? { move: 650, attack: 970 }
            : { move: 1030, attack: 1240 };
      const safeHolds = variant.presetWorld.controls.filter(
        (control) =>
          control.producerFixtureActorId === "wall-approach-probe" &&
          control.action.kind === "move" &&
          control.id !== `move-wall-approach-probe-${approachTicks.move}`
      );
      const safeHold = safeHolds[0];
      const stage = variant.presetWorld.controls.find(
        (control) => control.id === `move-wall-approach-probe-${approachTicks.move}`
      );
      const attack = variant.presetWorld.controls.find(
        (control) => control.id === `attack-wall-approach-probe-${approachTicks.attack}`
      );
      assert.deepEqual(probe?.position, tile(42, 16), variant.id);
      assert.equal(
        probe?.actorName,
        variant.id.includes("skaduwee") ? "TivaraSlingshotFemale" : "SkaduweeRangedFemale"
      );
      assert.ok(safeHolds.length > 1 && safeHolds.every((control) => control.applicationTick < approachTicks.move));
      assert.equal(safeHold?.applicationTick, 1, variant.id);
      assert.deepEqual(safeHold?.action.worldPosition, tile(49, 5), variant.id);
      assert.equal(stage?.applicationTick, approachTicks.move, variant.id);
      const approach = variant.id.includes("freestanding") ? { x: 38, y: 22 } : opening;
      assert.deepEqual(stage?.action.worldPosition, tile(approach.x + 2, approach.y), variant.id);
      assert.equal(attack?.applicationTick, approachTicks.attack, variant.id);
      assert.deepEqual(attack?.action.targetFixtureActorId, "protected-deposit");
    } else {
      assert.ok(
        variant.presetWorld.events.some((event) => event.id === "loss-protected-deposit" && event.tick === 200)
      );
    }
  }
  for (const variant of fixture.recipe.variants.filter((candidate) => candidate.id.includes("terrain"))) {
    const openingRow = 20;
    assert.deepEqual(
      variant.presetWorld.protectedRoutes
        .filter((route) => ["worker-service", "production-army", "retreat"].includes(route.id))
        .map(({ id, from, to }) => ({ id, from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y } })),
      [
        {
          id: "worker-service",
          from: { x: tile(28, 31).x, y: tile(28, 31).y },
          to: { x: tile(29, 30).x, y: tile(29, 30).y }
        },
        {
          id: "production-army",
          from: { x: tile(37, openingRow).x, y: tile(37, openingRow).y },
          to: { x: tile(39, openingRow).x, y: tile(39, openingRow).y }
        },
        {
          id: "retreat",
          from: { x: tile(39, openingRow).x, y: tile(39, openingRow).y },
          to: { x: tile(37, openingRow).x, y: tile(37, openingRow).y }
        }
      ]
    );
    assert.deepEqual(
      variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "army-transit")?.position,
      tile(37, openingRow)
    );
    assert.equal(
      variant.presetWorld.actors.some((actor) =>
        ["perimeter-stair", "perimeter-wall", "perimeter-wall-2"].includes(actor.fixtureActorId)
      ),
      false
    );
    const blocked = new Set(
      variant.presetWorld.terrainPatches.filter((patch) => patch.blocked).map((patch) => `${patch.x},${patch.y}`)
    );
    assert.deepEqual(
      [...blocked].sort(),
      ["37,14", "37,24"],
      `${variant.id}: terrain anchors must flank the first observed front at x=37`
    );
    assert.ok(
      !variant.presetWorld.terrainPatches.some((patch) => patch.terrain === "water"),
      `${variant.id}: the perimeter premise must isolate cliff anchors from a separate river-egress constraint`
    );
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
    assert.deepEqual(
      housing.map(({ fixtureActorId, position }) => ({ fixtureActorId, position })),
      [
        { fixtureActorId: "ready-house", position: tile(8, 8) },
        { fixtureActorId: "fortification-house-1", position: tile(8, 14) },
        { fixtureActorId: "fortification-house-2", position: tile(8, 20) }
      ],
      `${variant.id}: housing must not become a competing terrain anchor`
    );
  }
  for (const variant of fixture.recipe.variants.filter((candidate) => candidate.id.includes("freestanding"))) {
    const blocked = new Set(
      variant.presetWorld.terrainPatches.filter((patch) => patch.blocked).map((patch) => `${patch.x},${patch.y}`)
    );
    assert.ok(blocked.has("37,13"), `${variant.id}: missing northern control anchor`);
    assert.ok(blocked.has("37,25"), `${variant.id}: missing southern control anchor`);
  }
});

test("WALL-02 retains rally routes while transit probes cross the intentional opening", () => {
  const fixture = nativeScenarioFixture("WALL-02");
  assert.equal(fixture.recipe.variants.length, 8);
  assert.equal(fixture.assertions["WALL-02"].maximumTick, 2700);
  assert.equal(fixture.recipe.checkpointTicks.at(-1), 2700);
  for (const faction of ["Tivara", "Skaduwee"]) {
    const sameMatchVariants = fixture.recipe.variants.filter((variant) => variant.id.includes(faction.toLowerCase()));
    assert.equal(new Set(sameMatchVariants.map((variant) => variant.presetWorld.fixtureId)).size, 1);
  }
  for (const variant of fixture.recipe.variants) {
    const wallBank = variant.presetWorld.resourceStarts.find((start) => start.playerNumber === 2);
    assert.equal(wallBank?.amounts.stone, 4000, `${variant.id}: avoid an unrelated stone-mining assignment`);
    const actorRoles = variant.presetWorld.actors.map((actor) => actor.fixtureActorId).sort();
    assert.ok(actorRoles.length <= 23, `${variant.id}: keep the wall-access recipe free of unrelated battle actors`);
    assert.equal(
      actorRoles.some(
        (role) =>
          (role.startsWith("army-") && role !== "army-transit") || ["ranged-probe", "support-probe"].includes(role)
      ),
      false,
      `${variant.id}: route probes must be the only friendly military actors`
    );
    assert.ok(actorRoles.includes("scout-probe"), `${variant.id}: keep the scout for the nearby resource objective`);
    assert.ok(actorRoles.includes("frontier-scout-probe"), `${variant.id}: keep the scout for the frontier objective`);
    assert.equal(
      actorRoles.includes("enemy-worker"),
      false,
      `${variant.id}: do not add an unrelated early attack objective`
    );
    const armyRoute = variant.presetWorld.protectedRoutes.find((route) => route.id === "production-army");
    const retreat = variant.presetWorld.protectedRoutes.find((route) => route.id === "retreat");
    const tivara = variant.id.includes("tivara"),
      routeRow = tivara ? (variant.id.includes("-worker") ? 22 : variant.id.includes("-enemy-opening") ? 19 : 18) : 19,
      homeSide = tile(30, routeRow),
      exteriorSide = tile(26, routeRow),
      workerCrossing = tile(26, routeRow);
    assert.ok(armyRoute);
    assert.ok(retreat);
    assert.equal(armyRoute.tileMargin, 1);
    assert.deepEqual(armyRoute.from, { x: homeSide.x, y: homeSide.y });
    assert.deepEqual(armyRoute.to, { x: exteriorSide.x, y: exteriorSide.y });
    assert.deepEqual(retreat.from, { x: exteriorSide.x, y: exteriorSide.y });
    assert.deepEqual(retreat.to, { x: homeSide.x, y: homeSide.y });
    const perimeter = new Map(variant.presetWorld.actors.map((actor) => [actor.fixtureActorId, actor.position]));
    assert.deepEqual(perimeter.get("worker-0"), tile(28, 22));
    assert.deepEqual(perimeter.get("worker-1"), tile(27, 22));
    assert.equal(perimeter.has("perimeter-wall"), false);
    assert.equal(perimeter.has("perimeter-wall-2"), false);
    assert.deepEqual(
      variant.presetWorld.terrainPatches?.filter((patch) => patch.blocked).map(({ x, y }) => `${x},${y}`),
      ["27,13", "27,24"],
      `${variant.id}: use static terrain boundaries, not existing building occupancy, to anchor the candidate front`
    );
    assert.deepEqual(perimeter.get("perimeter-stair"), tile(42, 38));
    assert.deepEqual(perimeter.get("protected-deposit"), tile(42, 30));
    assert.equal(perimeter.has("contact-group"), false, `${variant.id}: exclude unrelated combat contact`);
    const workerTransitPosition =
      tivara && variant.id.includes("-worker")
        ? tile(32, routeRow)
        : tivara && (variant.id.includes("-army") || variant.id.includes("-concurrent"))
          ? tile(30, routeRow)
          : tile(30, 19);
    assert.deepEqual(perimeter.get("worker-transit"), workerTransitPosition);
    if (["army", "concurrent"].some((branch) => variant.id.includes("-" + branch))) {
      const armyTransit = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "army-transit");
      assert.deepEqual(perimeter.get("army-transit"), tile(32, 22));
      assert.equal(armyTransit?.owner, 2, `${variant.id}: test the AI faction's friendly army passage`);
      assert.equal(
        armyTransit?.actorName,
        tivara ? "TivaraMacemanMale" : "SkaduweeWarriorMale",
        `${variant.id}: use the AI faction's real ground army for the opening crossing`
      );
    } else assert.equal(perimeter.has("army-transit"), false, `${variant.id}: omit the unneeded army probe`);
    assert.deepEqual(perimeter.get("frontier-scout-probe"), tile(9, 6));

    const transits = variant.presetWorld.controls.filter(
      (control) =>
        ["worker-transit", "army-transit"].includes(control.producerFixtureActorId) && control.action.kind === "move"
    );
    const expectedRoles = variant.id.includes("-worker")
      ? ["worker-transit"]
      : variant.id.includes("-army")
        ? ["worker-transit"]
        : variant.id.includes("-concurrent")
          ? ["worker-transit"]
          : [];
    assert.deepEqual(
      [...new Set(transits.map((control) => control.producerFixtureActorId))].sort(),
      [...expectedRoles].sort(),
      `${variant.id}: controls must match the branch obligation`
    );
    assert.equal(transits.length, expectedRoles.length);
    const expectedTransitTick = variant.id.includes("tivara") ? (variant.id.includes("-worker") ? 1221 : 761) : 681;
    assert.deepEqual(
      [...new Set(transits.map((control) => control.applicationTick))].sort((left, right) => left - right),
      expectedRoles.length ? [expectedTransitTick] : []
    );
    assert.deepEqual(
      transits.map((control) => ({
        role: control.producerFixtureActorId,
        tick: control.applicationTick,
        target: control.action.kind === "move" ? control.action.worldPosition : null
      })),
      expectedRoles.length ? [{ role: "worker-transit", tick: expectedTransitTick, target: workerCrossing }] : [],
      `${variant.id}: issue only the branch's short transit proof controls`
    );
    const hostileControls = variant.presetWorld.controls;
    assert.equal(
      hostileControls.some((control) => control.id === "move-hostile-transit-200" && control.action.kind === "move"),
      variant.id.includes("-enemy-opening"),
      `${variant.id}: hostile access through the opening must be branch-scoped`
    );
    assert.equal(
      hostileControls.filter((control) => control.producerFixtureActorId?.startsWith("opening-pressure-")).length,
      0,
      `${variant.id}: the pressure case uses one hostile probe, not an unrelated squad battle`
    );
    if (variant.id.includes("-enemy-opening")) {
      const hostileStage = hostileControls.find((control) => control.id === "move-hostile-transit-200");
      const enemySideRoute = variant.presetWorld.protectedRoutes.find((route) => route.id === "production-army");
      assert.deepEqual(
        hostileStage?.action.kind === "move"
          ? { x: hostileStage.action.worldPosition.x, y: hostileStage.action.worldPosition.y }
          : undefined,
        enemySideRoute ? { x: enemySideRoute.to.x, y: enemySideRoute.to.y } : undefined,
        `${variant.id}: hostile probe must stage at the enemy-side end of the preserved route`
      );
      assert.ok(
        hostileControls.some(
          (control) =>
            control.producerFixtureActorId === "hostile-transit" &&
            control.applicationTick === 260 &&
            control.action.kind === "attack" &&
            control.action.targetFixtureActorId === "protected-deposit"
        ),
        `${variant.id}: staged hostile must apply real pressure through the opening`
      );
      assert.deepEqual(
        perimeter.get("hostile-transit"),
        tile(22, 18),
        `${variant.id}: the hostile route probe starts beside the opening for a short, targeted stage`
      );
      assert.equal(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "hostile-transit")?.actorName,
        variant.id.includes("tivara") ? "SkaduweeWarriorMale" : "TivaraMacemanMale",
        `${variant.id}: retain one real mobile hostile for pressure and route proof`
      );
    }
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
