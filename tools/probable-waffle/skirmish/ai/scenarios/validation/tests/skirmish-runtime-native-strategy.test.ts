import assert from "node:assert/strict";
import { test } from "node:test";
import { nativeScenarioBindings, nativeScenarioFixture } from "../../registration/native-scenario-registration.ts";
import { tile } from "../../worlds/native-world-geometry.ts";

test("STRAT-12 bounds the own-service raid to the decision and recovery window", () => {
  const fixture = nativeScenarioFixture("STRAT-12"),
    binding = nativeScenarioBindings.cases["STRAT-12"];
  assert.equal(binding.latestTick, 400);
  assert.deepEqual(binding.evidenceCheckpoints, [100, 200]);
  assert.deepEqual(fixture.recipe.checkpointTicks, [20, 100, 200, 400]);
  for (const faction of ["Tivara", "Skaduwee"]) {
    const variant = fixture.recipe.variants.find(
      (candidate) => candidate.aiFaction === faction && candidate.id.endsWith("-own-threat")
    );
    assert.ok(variant);
    assert.equal(
      variant.presetWorld.actors.filter((actor) => actor.fixtureActorId.startsWith("reinforcement-")).length,
      3
    );
    assert.deepEqual(
      variant.presetWorld.actors
        .filter((actor) => actor.fixtureActorId.startsWith("reinforcement-"))
        .map((actor) => actor.position),
      [tile(28, 27), tile(29, 27), tile(30, 27)]
    );
    assert.equal(
      variant.presetWorld.controls.filter(
        (control) => control.id.startsWith("attack-reinforcement-") && control.requestTick === 20
      ).length,
      3
    );
  }
});

test("STRAT-13 removes the infeasible front before its target can die naturally", () => {
  const fixture = nativeScenarioFixture("STRAT-13"),
    branches = fixture.assertions["STRAT-13"].requiredNativeScenario.branchByVariant;
  assert.equal(fixture.assertions["STRAT-13"].maximumTick, 1200);
  assert.deepEqual(nativeScenarioBindings.cases["STRAT-13"].evidenceCheckpoints, [800, 1000]);
  for (const faction of ["Tivara", "Skaduwee"]) {
    const variant = fixture.recipe.variants.find(
      (candidate) => candidate.aiFaction === faction && branches[candidate.id] === "infeasible"
    );
    assert.ok(variant, `${faction}:infeasible`);
    assert.ok(
      variant.presetWorld.actors.some((actor) => actor.fixtureActorId === "front-target-a"),
      variant.id
    );
    assert.equal(variant.presetWorld.events.find((event) => event.id === "loss-front-target-a")?.tick, 400, variant.id);
  }
});

test("STRAT-13 stages a compact force at two focused, reachable fronts", () => {
  const fixture = nativeScenarioFixture("STRAT-13"),
    branches = fixture.assertions["STRAT-13"].requiredNativeScenario.branchByVariant;
  for (const variant of fixture.recipe.variants) {
    const actors = variant.presetWorld.actors,
      roles = new Set(actors.map((actor) => actor.fixtureActorId));
    assert.equal(actors.filter((actor) => actor.fixtureActorId.startsWith("army-")).length, 8, variant.id);
    for (const role of [
      "contact-group",
      "scout-probe",
      "ranged-probe",
      "support-probe",
      "enemy-producer",
      "enemy-deposit",
      "enemy-source",
      "enemy-worker",
      "noise-scout"
    ])
      assert.equal(roles.has(role), false, `${variant.id}: ${role} is an unrelated competing target`);
    assert.equal(
      actors.find((actor) => actor.fixtureActorId === "front-target-a")?.actorName,
      branches[variant.id] === "infeasible"
        ? variant.aiFaction === "Tivara"
          ? "FrostForge"
          : "Sandhold"
        : actors.find((actor) => actor.fixtureActorId === "front-target-b")?.actorName,
      variant.id
    );
    assert.deepEqual(
      actors.find((actor) => actor.fixtureActorId === "front-target-a")?.position,
      tile(22, 18),
      variant.id
    );
    assert.deepEqual(
      actors.find((actor) => actor.fixtureActorId === "front-target-b")?.position,
      tile(42, 38),
      variant.id
    );
    for (let index = 0; index < 8; index++)
      assert.deepEqual(
        actors.find((actor) => actor.fixtureActorId === `army-${index}`)?.position,
        tile(25 + ((index % 4) % 2), (index < 4 ? 17 : 31) + Math.floor((index % 4) / 2)),
        `${variant.id}: army-${index} is staged at its front`
      );
  }
});

test("STRAT-09 target-specific variants separate an equivalent competing drop-off", () => {
  const fixture = nativeScenarioFixture("STRAT-09");
  for (const id of ["strat-09-skaduwee-raid", "strat-09-tivara-path-outage"]) {
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === id);
    assert.ok(variant);
    assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "enemy-deposit")?.position, {
      x: -640,
      y: 576,
      z: 0
    });
    assert.deepEqual(
      variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "main-target")?.position,
      id === "strat-09-skaduwee-raid" ? { x: 32, y: 848, z: 0 } : { x: -96, y: 880, z: 0 }
    );
    if (id === "strat-09-tivara-path-outage") {
      assert.equal(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "main-target")?.actorName,
        "FrostForge"
      );
    }
  }
  const unmodifiedControl = fixture.recipe.variants.find((candidate) => candidate.id === "strat-09-skaduwee-denial");
  assert.deepEqual(
    unmodifiedControl?.presetWorld.actors.find((actor) => actor.fixtureActorId === "enemy-deposit")?.position,
    { x: -320, y: 736, z: 0 }
  );
  const denial = fixture.recipe.variants.find((candidate) => candidate.id === "strat-09-tivara-denial");
  assert.deepEqual(denial?.presetWorld.actors.find((actor) => actor.fixtureActorId === "main-target")?.position, {
    x: -256,
    y: 832,
    z: 0
  });
});

test("RAID-01 unfinished producer clears the enemy deposit while keeping a nearby builder", () => {
  const fixture = nativeScenarioFixture("RAID-01");
  for (const faction of ["tivara", "skaduwee"]) {
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === `raid-01-${faction}-unfinished`);
    assert.ok(variant);
    const actors = new Map(variant.presetWorld.actors.map((actor) => [actor.fixtureActorId, actor]));
    const site = variant.presetWorld.constructionOrders.find((order) => order.fixtureActorId === "contact-group");
    assert.deepEqual(site?.position, { x: -224, y: 752, z: 0 });
    assert.deepEqual(actors.get("enemy-deposit")?.position, { x: -736, y: 784, z: 0 });
    assert.deepEqual(actors.get("enemy-worker")?.position, { x: -352, y: 784, z: 0 });
    assert.deepEqual(actors.get("enemy-source")?.position, { x: -448, y: 800, z: 0 });
    assert.deepEqual(site?.builderFixtureActorIds, ["enemy-worker"]);
  }
});

test("RAID-01 protected control keeps the raid defended and a separate main objective in opening reach", () => {
  const fixture = nativeScenarioFixture("RAID-01");
  for (const faction of ["tivara", "skaduwee"]) {
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === `raid-01-${faction}-protected`);
    assert.ok(variant);
    const actors = new Map(variant.presetWorld.actors.map((actor) => [actor.fixtureActorId, actor]));
    assert.equal(actors.get("contact-group")?.actorName, "WorkMill");
    assert.equal(
      variant.presetWorld.actors.filter((actor) => actor.fixtureActorId.startsWith("target-defense-")).length,
      8
    );
    assert.equal(actors.get("noise-scout")?.actorName, "Wall");
    assert.deepEqual(actors.get("front-target-a")?.position, { x: 352, y: 752, z: 0 });
    assert.deepEqual(actors.get("front-target-b")?.position, { x: -96, y: 976, z: 0 });
    const defenses = variant.presetWorld.actors.filter((actor) => actor.fixtureActorId.startsWith("target-defense-"));
    assert.deepEqual(
      defenses.map(({ position }) => position),
      Array.from({ length: 8 }, (_, index) => {
        const x = 27,
          y = 21 + index;
        return { x: (x - y) * 32 + 32, y: (x + y) * 16 + 16, z: 0 };
      })
    );
    assert.equal(new Set(defenses.map(({ position }) => `${position.x}:${position.y}`)).size, 8);
  }
});

test("RAID-01 worker raid includes a ranged unit and preserves the native WorkMill service path", () => {
  const fixture = nativeScenarioFixture("RAID-01");
  for (const [faction, expectedRanged] of [
    ["tivara", "TivaraSlingshotFemale"],
    ["skaduwee", "SkaduweeRangedFemale"]
  ] as const) {
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === `raid-01-${faction}-workers`);
    assert.ok(variant);
    const actors = new Map(variant.presetWorld.actors.map((actor) => [actor.fixtureActorId, actor]));
    assert.deepEqual(actors.get("enemy-worker")?.position, { x: -96, y: 816, z: 0 });
    assert.deepEqual(actors.get("enemy-deposit")?.position, { x: -736, y: 784, z: 0 });
    assert.deepEqual(actors.get("contact-group")?.position, { x: 0, y: 768, z: 0 });
    assert.equal(actors.get("army-4")?.actorName, expectedRanged);
  }
});

test("RAID-02 reveals a minimal larger counterforce after the original raid has time to hit", () => {
  const fixture = nativeScenarioFixture("RAID-02");
  for (const faction of ["tivara", "skaduwee"]) {
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === `raid-02-${faction}-reinforced`);
    assert.ok(variant);
    assert.equal(variant.presetWorld.actors.filter((actor) => actor.fixtureActorId.startsWith("forward-")).length, 4);
    const guards = variant.presetWorld.actors.filter((actor) => actor.fixtureActorId.startsWith("raid-guard-"));
    assert.equal(guards.length, 5);
    const initial = faction === "tivara" ? [8, 42] : [12, 38];
    assert.deepEqual(
      guards.map((guard) => guard.position),
      [
        tile(initial[0], initial[1]),
        tile(initial[0] + 1, initial[1]),
        tile(initial[0] + 2, initial[1]),
        tile(initial[0], initial[1] + 1),
        tile(initial[0] + 1, initial[1] + 1)
      ]
    );
    const movements = variant.presetWorld.controls.filter((control) => control.id.startsWith("raid-guard-"));
    assert.equal(movements.length, 5);
    assert.ok(movements.every((control) => control.applicationTick === 200 && control.action.kind === "move"));
  }
});

test("STRAT-05 blocked-retreat keeps a forward target on the attack side of the homeward barrier", () => {
  const fixture = nativeScenarioFixture("STRAT-05");
  const variant = fixture.recipe.variants.find((candidate) => candidate.id === "strat-05-tivara-blocked-retreat");
  assert.ok(variant);
  assert.equal(fixture.assertions["STRAT-05"].maximumTick, 600);
  assert.deepEqual(
    variant.presetWorld.actors.map((actor) => actor.fixtureActorId).sort(),
    [
      "worker-0",
      ...Array.from({ length: 8 }, (_, index) => `army-${index}`),
      "contact-group",
      "front-target-a",
      "front-target-b",
      ...Array.from({ length: 12 }, (_, index) => `reinforcement-${index}`)
    ].sort()
  );
  const barrier = variant.presetWorld.terrainPatches.filter((patch) => patch.y === 28 && patch.blocked);
  assert.equal(barrier.length, 50);
  assert.deepEqual(
    barrier.map((patch) => patch.x),
    Array.from({ length: 50 }, (_, index) => index)
  );
  assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "front-target-b")?.position, {
    x: 32,
    y: 656,
    z: 0
  });
});

test("STRAT-05 places the reinforced and quiet opening target within the initial force's approach", () => {
  const fixture = nativeScenarioFixture("STRAT-05");
  for (const variant of fixture.recipe.variants.filter((candidate) => !candidate.id.endsWith("blocked-retreat"))) {
    const target = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "front-target-a");
    assert.ok(target);
    assert.deepEqual(target.position, { x: 128, y: 832, z: 0 }, variant.id);
    assert.equal(variant.presetWorld.actors.length, variant.id.endsWith("quiet") ? 12 : 24);
    assert.equal(
      variant.presetWorld.actors.some((actor) => actor.fixtureActorId === "noise-scout"),
      false
    );
    if (variant.id.endsWith("reinforced"))
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "reinforcement-0")?.position,
        tile(42, 42),
        variant.id
      );
  }
  for (const variant of fixture.recipe.variants.filter((candidate) => !candidate.id.endsWith("quiet"))) {
    const reinforcements = variant.presetWorld.actors.filter((actor) =>
      actor.fixtureActorId.startsWith("reinforcement-")
    );
    assert.equal(reinforcements.length, 12);
    const blockedRetreat = variant.id.endsWith("blocked-retreat");
    assert.equal(
      variant.presetWorld.controls.filter((control) => control.id.startsWith("move-reinforcement-")).length,
      12
    );
    assert.ok(variant.presetWorld.controls.every((control) => control.applicationTick === 200));
    for (let index = 0; index < reinforcements.length; index++) {
      assert.deepEqual(
        reinforcements[index].position,
        tile(
          blockedRetreat ? 2 + (index % 4) : 42 + (index % 4),
          blockedRetreat ? 2 + Math.floor(index / 4) : 42 + Math.floor(index / 4)
        ),
        variant.id
      );
    }
  }
});

test("STRAT-02 and STRAT-03 keep the main offensive objective alive beyond raid contact", () => {
  for (const scenarioId of ["STRAT-02", "STRAT-03"]) {
    const fixture = nativeScenarioFixture(scenarioId);
    for (const variant of fixture.recipe.variants) {
      const target = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "main-target");
      assert.equal(target?.actorName, variant.aiFaction === "Tivara" ? "FrostForge" : "WatchTower");
      assert.deepEqual(target?.position, { x: -544, y: 688, z: 0 });
    }
  }
});

test("STRAT-03 reinforced raiders approach before attacking the fogged original home", () => {
  const fixture = nativeScenarioFixture("STRAT-03");
  for (const faction of ["tivara", "skaduwee"]) {
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === `strat-03-${faction}-reinforced`);
    assert.ok(variant);
    const directAttackers = faction === "skaduwee" ? 1 : 4;
    for (let index = 0; index < 12; index++) {
      const approach = variant.presetWorld.controls.find((control) => control.id === `raid-reinforce-${index}`);
      const attack = variant.presetWorld.controls.find((control) => control.id === `raid-reinforce-attack-${index}`);
      assert.equal(approach?.applicationTick, 800);
      assert.equal(approach?.action.kind, "move");
      if (index < directAttackers) {
        assert.equal(attack?.applicationTick, 1200);
        assert.equal(attack?.action.kind, "attack");
        assert.equal(attack?.action.targetFixtureActorId, "original-home");
      } else assert.equal(attack, undefined);
    }
  }
});

test("STRAT-03 Tivara withdrawn stages, threatens and then withdraws the serious raid wave", () => {
  const fixture = nativeScenarioFixture("STRAT-03");
  const variant = fixture.recipe.variants.find((candidate) => candidate.id === "strat-03-tivara-withdrawn");
  assert.ok(variant);
  for (let index = 0; index < 12; index++) {
    const approach = variant.presetWorld.controls.find((control) => control.id === `raid-reinforce-${index}`);
    const attack = variant.presetWorld.controls.find((control) => control.id === `raid-reinforce-attack-${index}`);
    const leave = variant.presetWorld.controls.find((control) => control.id === `reinforcement-leave-${index}`);
    assert.equal(approach?.applicationTick, 800);
    assert.equal(approach?.action.kind, "move");
    if (index < 4) {
      assert.equal(attack?.applicationTick, 1200);
      assert.equal(attack?.action.kind, "attack");
    } else assert.equal(attack, undefined);
    assert.equal(leave?.applicationTick, 1400);
  }
});

test("STRAT-04 harmless-noise branches contain no counterforce wave; real-threat branches stage it", () => {
  const fixture = nativeScenarioFixture("STRAT-04");
  for (const faction of ["tivara", "skaduwee"]) {
    for (const branch of ["quiet", "noise"]) {
      const variant = fixture.recipe.variants.find((candidate) => candidate.id === `strat-04-${faction}-${branch}`);
      assert.ok(variant);
      assert.equal(
        variant.presetWorld.actors.filter((actor) => actor.fixtureActorId.startsWith("reinforcement-")).length,
        0
      );
      if (branch === "noise") {
        assert.equal(
          variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "noise-scout")?.actorName,
          faction === "tivara" ? "SkaduweeWorkerMale" : "TivaraWorkerMale"
        );
        assert.equal(
          variant.presetWorld.controls.filter((control) => control.producerFixtureActorId === "noise-scout").length,
          4
        );
      }
    }
    const threat = fixture.recipe.variants.find((candidate) => candidate.id === `strat-04-${faction}-real-threat`);
    assert.ok(threat);
    assert.equal(
      threat.presetWorld.actors.filter((actor) => actor.fixtureActorId.startsWith("reinforcement-")).length,
      12
    );
    assert.equal(
      threat.presetWorld.controls.filter((control) => control.id.startsWith("move-reinforcement-")).length,
      12
    );
  }
});

test("STRAT-02 boat raid starts out of sight and unloads before its attack orders", () => {
  const fixture = nativeScenarioFixture("STRAT-02");
  const variant = fixture.recipe.variants.find((candidate) => candidate.id === "strat-02-skaduwee-boat-raid");
  assert.ok(variant);
  const actors = new Map(variant.presetWorld.actors.map((actor) => [actor.fixtureActorId, actor]));
  const controls = new Map(variant.presetWorld.controls.map((control) => [control.id, control]));
  assert.deepEqual(actors.get("raid-carrier")?.position, { x: 128, y: 288, z: 0 });
  assert.deepEqual(actors.get("raider-0")?.position, { x: 64, y: 224, z: 0 });
  assert.ok(
    variant.presetWorld.terrainPatches.some((patch) => patch.x === 10 && patch.y === 7 && patch.terrain === "water")
  );
  assert.ok(
    variant.presetWorld.terrainPatches.some((patch) => patch.x === 8 && patch.y === 6 && patch.terrain === "water")
  );
  assert.ok(!variant.presetWorld.terrainPatches.some((patch) => patch.x === 7 && patch.y === 6));
  assert.ok(
    variant.presetWorld.terrainPatches.some((patch) => patch.x === 29 && patch.y === 19 && patch.terrain === "water")
  );
  assert.ok(!variant.presetWorld.terrainPatches.some((patch) => patch.x === 30 && patch.y === 20));
  assert.equal(controls.get("raid-sail")?.applicationTick, 500);
  assert.deepEqual(controls.get("raid-sail")?.action.worldPosition, { x: 352, y: 816, z: 0 });
  assert.equal(controls.get("raid-unload")?.applicationTick, 680);
  assert.deepEqual(controls.get("raid-unload")?.action.worldPosition, { x: 320, y: 832, z: 0 });
  assert.equal(controls.get("raid-attack-0")?.applicationTick, 700);
});

test("STRAT-09 failing combat variants stage the initial army on navigable field tiles", () => {
  const fixture = nativeScenarioFixture("STRAT-09");
  for (const id of ["strat-09-tivara-denial", "strat-09-skaduwee-raid", "strat-09-tivara-path-outage"]) {
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === id);
    assert.ok(variant);
    assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "army-0")?.position, {
      x: 544,
      y: 912,
      z: 0
    });
  }
});
