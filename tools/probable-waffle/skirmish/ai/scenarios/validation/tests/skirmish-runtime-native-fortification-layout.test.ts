import assert from "node:assert/strict";
import { test } from "node:test";
import { tile } from "../../worlds/native-world-geometry.ts";
import { nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";

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
