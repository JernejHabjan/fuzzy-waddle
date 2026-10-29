import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { nativeScenarioBindings, nativeScenarioFixture } from "./native-scenario-registration.mjs";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.mjs";

test("all native bindings retain their full branches and original acceptance obligations", () => {
  const ids = Object.keys(nativeScenarioBindings.cases);
  assert.equal(ids.length, 84);
  const manifest = JSON.parse(readFileSync(new URL("./fixtures/skirmish-v1.json", import.meta.url)));
  for (const id of ids) {
    const row = manifest.rows.find((row) => row.id === id);
    assert.equal(row.fixture, `${id.toLowerCase()}-native-runtime.json`);
    assert.equal(row.runtimeRecipeDraft, undefined);
    const fixture = JSON.parse(readFileSync(new URL(`./fixtures/${row.fixture}`, import.meta.url)));
    assert.equal(validNativeScenarioFixture(fixture, id), true);
    assert.ok(fixture.acceptance.required.length > 0);
    assert.ok(fixture.acceptance.forbidden.length > 0);
    assert.equal(fixture.status, "authored_not_executed");
  }
});

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

test("RAID-01 remote expansion fixture staffs the actual raid deposit", () => {
  const fixture = nativeScenarioFixture("RAID-01");
  for (const [faction, expectedContact] of [
    ["tivara", "SkaduweeWarriorMale"],
    ["skaduwee", "TivaraMacemanMale"]
  ]) {
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
  ]) {
    const variant = fixture.recipe.variants.find((candidate) => candidate.id === `raid-01-${faction}-workers`);
    assert.ok(variant);
    const actors = new Map(variant.presetWorld.actors.map((actor) => [actor.fixtureActorId, actor]));
    assert.deepEqual(actors.get("enemy-worker")?.position, { x: -96, y: 816, z: 0 });
    assert.deepEqual(actors.get("enemy-deposit")?.position, { x: -736, y: 784, z: 0 });
    assert.deepEqual(actors.get("contact-group")?.position, { x: 0, y: 768, z: 0 });
    assert.equal(actors.get("army-4")?.actorName, expectedRanged);
  }
});

test("STRAT-05 blocked-retreat keeps a forward target on the attack side of the homeward barrier", () => {
  const fixture = nativeScenarioFixture("STRAT-05");
  const variant = fixture.recipe.variants.find((candidate) => candidate.id === "strat-05-tivara-blocked-retreat");
  assert.ok(variant);
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

test("D-03 preserves every difficulty/hidden mutation and the legitimate-contact control", () => {
  const fixture = nativeScenarioFixture("D-03"),
    contract = fixture.assertions["D-03"].requiredNativeScenario;
  assert.equal(fixture.recipe.variants.length, 30);
  for (const [mutation, mutate] of [
    ["position", (v) => (v.presetWorld.controls = [])],
    ["health", (v) => (v.presetWorld.events = [])],
    ["queue", (v) => (v.presetWorld.controls = [])],
    ["contact", (v) => (v.presetWorld.controls[0].action.worldPosition.x = 0)]
  ]) {
    const copy = structuredClone(fixture);
    const variant = copy.recipe.variants.find((v) => contract.branchByVariant[v.id] === `easy_${mutation}`);
    assert.ok(variant);
    mutate(variant);
    assert.equal(validNativeScenarioFixture(copy, "D-03"), false);
  }
});

test("continuous, optional-release, topology and debug bindings retain their causal controls", () => {
  for (const [id, branch, mutate] of [
    ["H-05", "uncertain", (world) => delete world.receiptFault.holdHistory],
    ["H-05", "paid", (world) => (world.queues = [])],
    ["H-20", "dispose", (world) => world.routeOutages.pop()],
    ["H-23", "builder_late", (world) => (world.routeOutages[0].membership = "optional_passenger")],
    ["H-23", "optional_lost", (world) => (world.events = [])],
    ["H-23", "optional_late", (world) => (world.terrainPatches = [])],
    ["SEQ-03", "congested", (world) => (world.initialOrders = [])],
    ["SEQ-04", "cancel_race", (world) => (world.researchQueues = [])],
    ["SEQ-06", "stair", (world) => (world.events = [])],
    ["SEQ-07", "alternate", (world) => (world.terrainPatches = [])],
    ["D-04", "opening_counter_retreat_recovery", (world) => (world.events = [])],
    ["D-05", "hard", (world) => (world.controls = [])],
    ["DBG-06", "quota", (world) => delete world.receiptFault.holdHistory]
  ]) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((value) => contract.branchByVariant[value.id] === branch);
    assert.ok(variant, `${id}:${branch}`);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
  for (const id of ["D-03", "DBG-06"]) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const pair = fixture.recipe.variants.filter(
      (variant) =>
        variant.aiFaction === "Tivara" && (id !== "D-03" || contract.branchByVariant[variant.id].startsWith("easy_"))
    );
    assert.equal(new Set(pair.map((variant) => variant.presetWorld.fixtureId)).size, 1);
  }
});

test("authority and priority bindings reject erased consumer faults and altered native premises", () => {
  for (const [id, branch, mutate] of [
    ["H-12", "permuted", (world) => (world.proposalOrder = "forward")],
    ["H-12", "paid_neighbor", (world) => (world.constructionOrders = [])],
    ["H-11", "infeasible", (world) => (world.sourceStocks = [])],
    ["H-11", "bootstrap", (world) => delete world.recoveryStart],
    ["H-30", "debug", (world) => delete world.brainFault],
    ["H-30", "mandatory", (world) => (world.brainFault.kind = "throw")],
    ["H-06", "rejected", (world) => delete world.receiptFault.contendQueue],
    ["H-07", "destroyed", (world) => delete world.receiptFault.destroyOutput],
    ["H-10", "below_capacity", (world) => world.receiptFault.maximumCommands++],
    ["H-10", "resumed", (world) => world.receiptFault.throughTick++],
    ["H-13", "new_identity", (world) => (world.controls = [])],
    ["H-13", "essential", (world) => (world.events = [])],
    ["H-14", "harmless", (world) => (world.controls = [])],
    ["H-15", "lethal", (world) => delete world.receiptFault.holdHistory],
    [
      "H-15",
      "resolved",
      (world) => (world.controls = world.controls.filter((control) => control.applicationTick < 1000))
    ]
  ]) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((value) => contract.branchByVariant[value.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

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

test("H-06/H-07 keep the receipt fault active through their first native production demand", () => {
  for (const id of ["H-06", "H-07"]) {
    const fixture = nativeScenarioFixture(id),
      identities = new Map();
    for (const variant of fixture.recipe.variants) {
      assert.equal(variant.presetWorld.receiptFault.commandKind, "production");
      assert.equal(variant.presetWorld.receiptFault.throughTick, 1800);
      assert.equal(
        variant.presetWorld.actors.filter((actor) => actor.fixtureActorId.startsWith("army-")).length,
        2,
        `${id}/${variant.id}: keep a real native production demand reachable`
      );
      const branch = fixture.assertions[id].requiredNativeScenario.branchByVariant[variant.id];
      identities.set(variant.aiFaction, [...(identities.get(variant.aiFaction) ?? []), variant.presetWorld.fixtureId]);
      if (id === "H-06" && branch === "rejected") assert.equal(variant.presetWorld.receiptFault.contendQueue, true);
      if (id === "H-07" && branch === "destroyed") assert.equal(variant.presetWorld.receiptFault.destroyOutput, true);
    }
    for (const fixtureIds of identities.values()) assert.equal(new Set(fixtureIds).size, 1);
  }
});

test("H-30 holds the faction's late native queue command and samples after release", () => {
  const fixture = nativeScenarioFixture("H-30"),
    contract = fixture.assertions["H-30"].requiredNativeScenario;
  assert.equal(contract.latestTick, 4000);
  assert.ok(fixture.recipe.checkpointTicks.includes(4000));
  for (const variant of fixture.recipe.variants) {
    assert.equal(
      variant.presetWorld.receiptFault.commandKind,
      variant.aiFaction === "Skaduwee" ? "production" : "research"
    );
    assert.equal(variant.presetWorld.receiptFault.throughTick, variant.aiFaction === "Skaduwee" ? 1800 : 2800);
    assert.equal(variant.presetWorld.brainFault.throughTick, 800);
  }
});

test("D-01 binds each actual lobby policy in both factions and rejects a relabelled Normal fallback", () => {
  const fixture = nativeScenarioFixture("D-01"),
    contract = fixture.assertions["D-01"].requiredNativeScenario;
  assert.equal(fixture.recipe.variants.length, 6);
  for (const faction of ["Tivara", "Skaduwee"])
    for (const [branch, difficulty] of [
      ["easy", "Easy"],
      ["normal", "Normal"],
      ["hard", "Hard"]
    ]) {
      const variant = fixture.recipe.variants.find(
        (value) => value.aiFaction === faction && contract.branchByVariant[value.id] === branch
      );
      assert.ok(variant);
      assert.equal(variant.difficulty, difficulty);
      assert.equal(variant.presetWorld.resourceGrants.length, 0);
    }
  fixture.recipe.variants[0].difficulty = "Normal";
  assert.equal(validNativeScenarioFixture(fixture, "D-01"), false);
});

test("all supported native bindings are connected and no executable registration hides behind a draft", () => {
  const drafts = JSON.parse(readFileSync(new URL("./fixtures/native-scenario-recipes.json", import.meta.url)));
  assert.deepEqual(drafts.scenarioIds, []);
  assert.deepEqual(drafts.cases, []);
  const manifest = JSON.parse(readFileSync(new URL("./fixtures/skirmish-v1.json", import.meta.url)));
  assert.deepEqual(
    manifest.rows.filter((row) => row.drivers.includes("runtime") && !row.fixture && !row.runtimeSupport),
    []
  );
});

test("H-09 retains real compaction, SP codec restore and independent peer acknowledgment branches", () => {
  const fixture = nativeScenarioFixture("H-09");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 6);
  assert.ok(fixture.recipe.checkpointTicks.includes(20));
  assert.ok(fixture.recipe.checkpointTicks.includes(199));
  assert.equal(fixture.assertions["H-09"].requiredNativeScenario.latestTick, 2400);
  for (const variant of fixture.recipe.variants) {
    assert.equal(variant.captureConstruction, true);
    assert.equal(variant.captureCombat, true);
    assert.equal(variant.presetWorld.receiptFault.holdHistory, true);
  }
});

test("SEQ-08 binds complete supported SP chains and a distinct real MP transfer chain", () => {
  const fixture = nativeScenarioFixture("SEQ-08");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 8);
  assert.equal(fixture.assertions["SEQ-08"].requiredNativeScenario.latestTick, 18000);
  for (const variant of fixture.recipe.variants) {
    const branch = fixture.assertions["SEQ-08"].requiredNativeScenario.branchByVariant[variant.id];
    assert.deepEqual(variant.checkpointTicks, [
      { before_apply: 19, applied_pending: 199, during_active: 119, host_transfer: 19 }[branch],
      400
    ]);
    assert.equal(
      variant.presetWorld.actors.some((actor) => actor.fixtureActorId === "recovery-door"),
      false
    );
    assert.equal(variant.presetWorld.events.length, 0);
    assert.equal(variant.presetWorld.controls.length, 0);
    assert.equal(variant.presetWorld.routeOutages.length, 0);
  }
});

test("DBG-01/03 retain native codec incidents, complete physical replay and isolated stepping/live-read boundaries", () => {
  for (const id of ["DBG-01", "DBG-03"]) {
    const fixture = nativeScenarioFixture(id);
    assert.equal(fixture.recipe.requiresMultiplayer === true, id === "DBG-03");
    assert.equal(fixture.recipe.variants.length, id === "DBG-01" ? 8 : 4);
    for (const variant of fixture.recipe.variants) {
      assert.deepEqual(variant.checkpointTicks, [599, 800]);
      assert.equal(variant.captureConstruction, true);
      assert.equal(variant.presetWorld.constructionOrders.length, 1);
      assert.equal(variant.presetWorld.researchQueues.length, 1);
      assert.equal(variant.presetWorld.queues[0].count, 4);
      assert.equal(variant.presetWorld.events.length, 0);
      assert.equal(variant.presetWorld.controls.length, 0);
      assert.equal(variant.presetWorld.routeOutages.length, 0);
    }
  }
});

test("D-06 dispatch descriptors bind frozen legal starts without substituting generic preset worlds for calibration", () => {
  const fixture = nativeScenarioFixture("D-06");
  assert.equal(fixture.recipe.variants.length, 6);
  assert.equal(fixture.recipe.mapLabel, "River Crossing");
  assert.ok(
    fixture.capabilityLimits.some((entry) => /^Frozen workload specification sha256:[a-f0-9]{64}$/.test(entry))
  );
  for (const variant of fixture.recipe.variants) {
    assert.equal(variant.executionKind, "focused_natural");
    assert.equal(variant.presetWorld, undefined);
    assert.equal(variant.captureConstruction, undefined);
    assert.ok(variant.setupRationale.includes("frozen"));
  }
});

test("H-08 retains original timeout/cancel boundaries and both real old-epoch delivery orders", () => {
  const fixture = nativeScenarioFixture("H-08");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 8);
  assert.ok(fixture.recipe.checkpointTicks.includes(199));
  assert.ok(fixture.recipe.checkpointTicks.includes(1801));
  for (const variant of fixture.recipe.variants) {
    assert.equal(variant.presetWorld.receiptFault.holdHistory, true);
    assert.equal(variant.presetWorld.receiptFault.throughTick, 1800);
    assert.equal(variant.presetWorld.receiptFault.maximumCommands, 1);
  }
});

test("H-31 binds autonomous single-player codec continuation without unsupported queues or future external inputs", () => {
  const fixture = nativeScenarioFixture("H-31"),
    branches = fixture.assertions["H-31"].requiredNativeScenario.branchByVariant;
  assert.equal(fixture.recipe.variants.length, 8);
  assert.equal(fixture.recipe.requiresMultiplayer, undefined);
  for (const variant of fixture.recipe.variants) {
    const world = variant.presetWorld,
      branch = branches[variant.id];
    assert.equal(world.events.length, 0);
    assert.equal(world.controls.length, 0);
    assert.equal(world.routeOutages.length, 0);
    assert.equal(variant.captureConstruction, true);
    assert.equal(variant.captureCombat, undefined);
    assert.ok(variant.checkpointTicks[0] < variant.checkpointTicks[1]);
    if (branch === "during_active") {
      assert.equal(world.queues[0].count, 4);
      assert.equal(world.researchQueues.length, 1);
      assert.equal(world.constructionOrders.length, 1);
    }
    if (branch === "applied_pending") assert.equal(world.receiptFault.throughTick, variant.checkpointTicks[0]);
  }
});

test("D-02 retains all selected policies and independent real multiplayer checkpoint transfer", () => {
  const fixture = nativeScenarioFixture("D-02"),
    branches = fixture.assertions["D-02"].requiredNativeScenario.branchByVariant;
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 18);
  for (const variant of fixture.recipe.variants) {
    const branch = branches[variant.id],
      pending = branch.endsWith("pending_plan");
    assert.equal(variant.checkpointTicks[0], pending ? 199 : { Easy: 39, Normal: 19, Hard: 9 }[variant.difficulty]);
    assert.equal(variant.captureCombat, undefined);
    assert.equal(variant.presetWorld.receiptFault?.holdHistory, pending ? true : undefined);
  }
  const withoutRealPeers = structuredClone(fixture);
  delete withoutRealPeers.recipe.requiresMultiplayer;
  assert.equal(validNativeScenarioFixture(withoutRealPeers, "D-02"), false);
});

test("native cases cannot downgrade to generic counts or omit a faction, branch or physical channel", () => {
  for (const id of Object.keys(nativeScenarioBindings.cases))
    for (const mutate of [
      (value) => delete value.assertions[id].requiredNativeScenario,
      (value) => value.recipe.variants.pop(),
      (value) =>
        (value.recipe.variants[0].captureCombat = value.recipe.variants[0].captureCombat === true ? undefined : true),
      (value) =>
        (value.recipe.variants[0].captureConstruction =
          value.recipe.variants[0].captureConstruction === true ? undefined : true),
      (value) => (value.recipe.variants[0].evidenceStop = { earliestTick: 20, stableForTicks: 0 }),
      (value) => value.recipe.variants[0].seed++,
      (value) => {
        const variant = value.recipe.variants[0];
        const bank = variant.presetWorld?.resourceStarts[0];
        if (bank) bank.amounts.wood++;
        else variant.mapLabel = "invented-native-map";
      },
      (value) => (value.assertions[id].requiredNativeScenario.branchByVariant.invented = "quiet")
    ]) {
      const fixture = nativeScenarioFixture(id);
      mutate(fixture);
      assert.equal(validNativeScenarioFixture(fixture, id), false, id);
    }
});

test("H-32 binds real relay promotion, one retained realm and independent pending path/paid-work controls", () => {
  const fixture = nativeScenarioFixture("H-32");
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.equal(fixture.recipe.variants.length, 8);
  for (const faction of ["Tivara", "Skaduwee"]) {
    const pending = fixture.recipe.variants.find(
      (variant) =>
        variant.aiFaction === faction &&
        fixture.assertions["H-32"].requiredNativeScenario.branchByVariant[variant.id] === "pending_path"
    );
    assert.deepEqual(pending.presetWorld.routeOutages, [
      { id: "churn-stable-query", fromTick: 1, throughTick: 1001, fixtureActorIds: ["army-0"], mode: "pending" }
    ]);
    const host = fixture.recipe.variants.find(
      (variant) =>
        variant.aiFaction === faction &&
        fixture.assertions["H-32"].requiredNativeScenario.branchByVariant[variant.id] === "host_replacement"
    );
    assert.equal(host.presetWorld, undefined);
    assert.equal(host.executionKind, "focused_natural");
    assert.ok(host.nextMatchPresetWorld);
  }
  for (const mutate of [
    (value) => delete value.recipe.requiresMultiplayer,
    (value) => (value.recipe.variants.find((variant) => variant.nextMatchPresetWorld).presetWorld = {}),
    (value) => delete value.recipe.variants.find((variant) => variant.nextMatchPresetWorld).nextMatchPresetWorld,
    (value) => (value.recipe.variants.find((variant) => variant.id.endsWith("paid-queue")).checkpointTicks = [4000]),
    (value) =>
      (value.recipe.variants.find((variant) => variant.id.endsWith("pending-path")).presetWorld.routeOutages = [])
  ]) {
    const changed = structuredClone(fixture);
    mutate(changed);
    assert.equal(validNativeScenarioFixture(changed, "H-32"), false);
  }
});

test("DBG-05 retains every hostile import branch and real-peer authorization requirement", () => {
  const fixture = nativeScenarioFixture("DBG-05");
  assert.equal(fixture.recipe.variants.length, 12);
  assert.equal(fixture.recipe.requiresMultiplayer, true);
  assert.deepEqual(nativeScenarioBindings.cases["DBG-05"].branches, [
    "malformed",
    "oversized",
    "version_mismatch",
    "traversal",
    "html",
    "unauthorized_peer"
  ]);
  assert.ok(
    fixture.recipe.variants.every((variant) => variant.checkpointTicks[0] === 20 && !variant.captureConstruction)
  );
  delete fixture.recipe.requiresMultiplayer;
  assert.equal(validNativeScenarioFixture(fixture, "DBG-05"), false);
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
    const contact = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group");
    assert.deepEqual(probe?.position, { x: 384, y: 960, z: 0 });
    assert.deepEqual(contact?.position, { x: 160, y: 848, z: 0 });
  }
});

test("FIGHT-01 starts its favorable contact close to the authored army", () => {
  const fixture = nativeScenarioFixture("FIGHT-01");
  for (const variant of fixture.recipe.variants) {
    assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position, {
      x: 96,
      y: 848,
      z: 0
    });
  }
});

test("FIGHT-02 starts every valuable ranged probe at its authored damaged health", () => {
  const fixture = nativeScenarioFixture("FIGHT-02");
  for (const variant of fixture.recipe.variants) {
    assert.deepEqual(variant.presetWorld.healthStarts, [
      { fixtureActorId: "ranged-probe", healthPermille: 400, armourPermille: 0 }
    ]);
  }
});

test("FIGHT-03 unequal fronts retain a durable primary, isolated contact and matched loss event", () => {
  const fixture = nativeScenarioFixture("FIGHT-03");
  for (const variant of fixture.recipe.variants.filter((entry) => /(?:unequal|infeasible)$/.test(entry.id))) {
    const world = variant.presetWorld;
    const primary = world.actors.find((actor) => actor.fixtureActorId === "front-target-a");
    const secondary = world.actors.find((actor) => actor.fixtureActorId === "front-target-b");
    assert.equal(primary?.actorName, variant.aiFaction === "Tivara" ? "FrostForge" : "Sandhold");
    assert.equal(secondary?.actorName, variant.aiFaction === "Tivara" ? "InfantryInn" : "AnkGuard");
    assert.deepEqual(secondary?.position, { x: 160, y: 1296, z: 0 });
    assert.equal(world.actors.filter((actor) => actor.fixtureActorId.startsWith("front-reinforcement-")).length, 6);
    if (variant.id.endsWith("infeasible")) {
      const loss = world.events.find((event) => event.id === "loss-front-target-a");
      assert.equal(loss?.tick, 400);
      assert.equal(loss?.fixtureActorId, primary.fixtureActorId);
      assert.equal(loss?.objectName, primary.actorName);
    }
  }
});

test("FIGHT-04 support branches start with only their tested native spell already researched", () => {
  const fixture = nativeScenarioFixture("FIGHT-04"),
    binding = fixture.assertions["FIGHT-04"].requiredNativeScenario;
  for (const variant of fixture.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    if (branch === "overkill") {
      assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position, {
        x: 128,
        y: 864,
        z: 0
      });
      assert.deepEqual(
        variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "front-target-a")?.position,
        { x: 0, y: 864, z: 0 }
      );
      continue;
    }
    if (!["healing", "zone", "support_expiry", "pending_effect"].includes(branch)) continue;
    const researchType =
      branch === "zone"
        ? "firestormSpell"
        : branch === "support_expiry"
          ? "healingTotemSpell"
          : variant.aiFaction === "Tivara"
            ? "healingRainSpell"
            : "healingLightSpell";
    assert.deepEqual(variant.presetWorld.completedResearch, [{ playerNumber: 2, researchType }]);
    assert.equal(variant.presetWorld.researchQueues, undefined);
    if (["healing", "support_expiry", "pending_effect"].includes(branch))
      assert.ok(
        variant.presetWorld.healthStarts.some(
          (start) => start.fixtureActorId === "support-probe" && start.healthPermille === 350
        ),
        `${variant.id}:wounded caster supplies an in-range ally target`
      );
    if (branch === "zone")
      assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position, {
        x: 64,
        y: 896,
        z: 0
      });
  }
});

test("FIGHT-05 target-loss starts in attack range and removes the contact after native damage begins", () => {
  const fixture = nativeScenarioFixture("FIGHT-05");
  const variant = fixture.recipe.variants.find((candidate) => candidate.id === "fight-05-tivara-target-loss");
  assert.ok(variant);
  assert.deepEqual(
    variant.presetWorld.events.find((event) => event.id === "loss-contact-group"),
    {
      id: "loss-contact-group",
      tick: 200,
      kind: "destroy_owned_actor",
      owner: 1,
      objectName: "SkaduweeWarriorMale",
      fixtureActorId: "contact-group"
    }
  );
  assert.deepEqual(variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group")?.position, {
    x: 64,
    y: 800,
    z: 0
  });
});

test("FIGHT-05 status controls cast researched spells before combat removes the caster", () => {
  const fixture = nativeScenarioFixture("FIGHT-05"),
    binding = fixture.assertions["FIGHT-05"].requiredNativeScenario;
  for (const variant of fixture.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    if (!["stun", "slow"].includes(branch)) continue;
    const spellType = branch === "stun" ? "snowstorm" : "frostNova";
    const researchType = branch === "stun" ? "snowstormSpell" : "frostNovaSpell";
    assert.deepEqual(variant.presetWorld.completedResearch, [{ playerNumber: 1, researchType }]);
    assert.equal(variant.presetWorld.researchQueues, undefined);
    assert.deepEqual(
      variant.presetWorld.controls.find((control) => control.id === "native-status"),
      {
        id: "native-status",
        producerFixtureActorId: "enemy-caster",
        requestTick: 20,
        applicationTick: 20,
        action: { kind: "cast", spellType, targetFixtureActorId: "ranged-probe" }
      }
    );
  }
});

test("FIGHT-05 disconnected contact uses its native terrain obstruction without a dead-worker wall control", () => {
  const fixture = nativeScenarioFixture("FIGHT-05");
  const variant = fixture.recipe.variants.find((candidate) => candidate.id === "fight-05-tivara-disconnected");
  assert.ok(variant);
  assert.equal(
    variant.presetWorld.controls.some((control) => control.id === "block-route"),
    false
  );
  assert.ok(variant.presetWorld.terrainPatches.some((patch) => patch.blocked));
});

test("WALL-01 terrain chokes provide opposite cliff anchors and fund the bounded graph", () => {
  const fixture = nativeScenarioFixture("WALL-01");
  const variants = fixture.recipe.variants.filter((variant) => variant.id.includes("terrain"));
  assert.equal(variants.length, 2);
  for (const variant of variants) {
    assert.equal(
      variant.presetWorld.actors.some((actor) =>
        ["perimeter-stair", "perimeter-wall", "perimeter-wall-2"].includes(actor.fixtureActorId)
      ),
      false
    );
    const blocked = new Set(
      variant.presetWorld.terrainPatches
        .filter((patch) => patch.blocked)
        .map((patch) => `${patch.x},${patch.y}`)
    );
    assert.ok(blocked.has("29,12"), `${variant.id}: missing north cliff anchor`);
    assert.ok(blocked.has("29,22"), `${variant.id}: missing south cliff anchor`);
    const aiStart = variant.presetWorld.resourceStarts.find(
      (start) => start.playerNumber === fixture.recipe.aiPlayerNumber
    );
    assert.ok(aiStart);
    // Eight wall-line nodes plus two stairs cost at most 700 stone; the standard 20% ceiling can fund that prefix.
    assert.ok(aiStart.amounts.stone >= 3500, `${variant.id}: insufficient stone for the bounded 700-stone graph`);
  }
});

test("source-controlled worlds reject erased perturbations, fake observations and altered topology", () => {
  for (const [id, branch, mutate] of [
    ["SCOUT-02", "hidden_health", (world) => (world.events = [])],
    ["SCOUT-02", "hidden_queue", (world) => (world.controls = [])],
    ["WALL-01", "terrain", (world) => (world.terrainPatches = [])],
    ["FIGHT-05", "stun", (world) => (world.completedResearch = [])],
    ["FIGHT-04", "healing", (world) => (world.completedResearch = [])],
    ["STRAT-10", "combined_loss", (world) => (world.events = [])],
    ["STRAT-07", "breach", (world) => (world.events = [])],
    ["H-28", "prefix", (world) => (world.sourceStocks = [])]
  ]) {
    const fixture = nativeScenarioFixture(id),
      binding = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((variant) => binding.branchByVariant[variant.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

test("capability-specific spell branches never invent the other faction's caster", () => {
  const fight = nativeScenarioFixture("FIGHT-05"),
    binding = fight.assertions["FIGHT-05"].requiredNativeScenario;
  for (const variant of fight.recipe.variants) {
    const branch = binding.branchByVariant[variant.id];
    if (branch === "stun") assert.equal(variant.humanFaction, "Skaduwee");
    if (branch === "slow") assert.equal(variant.humanFaction, "Tivara");
  }
});

test("mission bindings cannot erase native transport, outages, team controls or the terminal horizon", () => {
  for (const [id, branch, mutate] of [
    ["RAID-03", "boat_raid", (v) => (v.presetWorld.controls = [])],
    ["STRAT-09", "path_outage", (v) => delete v.presetWorld.routeOutages],
    ["C-06", "defeated", (v) => delete v.additionalAiPlayers],
    ["C-06", "allied_control", (v) => (v.lobbyTeams = [])],
    [
      "DOMAIN-02",
      "intercept",
      (v) => (v.presetWorld.actors.find((a) => a.fixtureActorId === "contact-group").owner = 1)
    ],
    ["STRAT-08", "exposed", (v) => (v.checkpointTicks = [20, 4000])]
  ]) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((v) => contract.branchByVariant[v.id] === branch);
    assert.ok(variant);
    mutate(variant);
    assert.equal(validNativeScenarioFixture(fixture, id), false, id);
  }
});

test("unsupported naval and diplomacy content is explicit rather than silently invented", () => {
  const waterOnly = nativeScenarioFixture("DOMAIN-01");
  assert.deepEqual(
    waterOnly.recipe.variants.map(
      (variant) => waterOnly.assertions["DOMAIN-01"].requiredNativeScenario.branchByVariant[variant.id]
    ),
    ["irrelevant", "irrelevant"]
  );
  const naval = nativeScenarioFixture("DOMAIN-02");
  assert.ok(
    naval.recipe.variants.some(
      (variant) => naval.assertions["DOMAIN-02"].requiredNativeScenario.branchByVariant[variant.id] === "coast"
    )
  );
  assert.ok(naval.capabilityLimits.length);
  assert.deepEqual(
    naval.recipe.variants
      .filter((v) => v.aiFaction === "Skaduwee")
      .map((v) => naval.assertions["DOMAIN-02"].requiredNativeScenario.branchByVariant[v.id]),
    ["unsupported"]
  );
  assert.ok(nativeScenarioFixture("C-06").capabilityLimits.some((limit) => limit.includes("unsupported")));
});

test("DOMAIN-02 makes positive coast access naval and limits transport controls to escort", () => {
  const fixture = nativeScenarioFixture("DOMAIN-02"),
    binding = fixture.assertions["DOMAIN-02"].requiredNativeScenario;
  const variants = fixture.recipe.variants.map((variant) => ({
    variant,
    branch: binding.branchByVariant[variant.id]
  }));
  for (const { variant, branch } of variants) {
    const water = new Set(
      variant.presetWorld.terrainPatches
        .filter((patch) => patch.terrain === "water")
        .map((patch) => `${patch.x},${patch.y}`)
    );
    for (let y = 12; y <= 32; y++) assert.ok(water.has(`28,${y}`), `${branch}: disconnected water at 28,${y}`);
    for (let x = 26; x <= 28; x++)
      for (let y = 23; y <= 25; y++)
        assert.ok(water.has(`${x},${y}`), `${branch}: naval river crossing unexpectedly has land at ${x},${y}`);
    if (branch === "coast") {
      const objective = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "contact-group");
      const scout = variant.presetWorld.actors.find((actor) => actor.fixtureActorId === "scout-probe");
      assert.equal(objective.actorName, "WorkMill");
      assert.deepEqual(objective.position, { x: 608, y: 528, z: 0 });
      assert.deepEqual(scout.position, { x: -288, y: 816, z: 0 });
      assert.ok(water.has("26,7"), "coast objective remains shore-adjacent to the naval channel");
      const blocked = new Set(
        variant.presetWorld.terrainPatches.filter((patch) => patch.blocked).map((patch) => `${patch.x},${patch.y}`)
      );
      for (let y = 0; y <= 49; y++) {
        assert.ok(blocked.has(`23,${y}`), `coast: western ground barrier has a gap at 23,${y}`);
        assert.ok(blocked.has(`32,${y}`), `coast: eastern ground barrier has a gap at 32,${y}`);
        assert.ok(water.has(`28,${y}`), `coast: water channel has a gap at 28,${y}`);
      }
    }
    assert.equal(
      variant.presetWorld.actors.some((actor) => actor.fixtureActorId === "escort-carrier"),
      branch === "escort"
    );
    assert.equal(
      variant.presetWorld.controls.some((control) => control.id === "escort-unload"),
      branch === "escort"
    );
    if (branch === "escort") {
      assert.equal(variant.presetWorld.controls.find((control) => control.id === "escort-unload").applicationTick, 800);
      assert.ok(variant.presetWorld.controls.some((control) => control.id === "escort-retreat"));
    }
    if (["intercept", "escort"].includes(branch)) {
      assert.equal(
        variant.additionalAiPlayers?.some((player) => player.playerNumber === 3),
        true
      );
      assert.ok(variant.presetWorld.existingActorBindings.some((actor) => actor.fixtureActorId === "third-home"));
    } else {
      assert.equal(Boolean(variant.additionalAiPlayers?.some((player) => player.playerNumber === 3)), false);
      assert.equal(
        variant.presetWorld.existingActorBindings.some((actor) => actor.fixtureActorId === "third-home"),
        false
      );
    }
  }
});

test("recovery bindings preserve actual obstruction, healthy work and finite pending/error inputs", () => {
  for (const [id, branch, mutate] of [
    ["H-01", "persistent", (world) => (world.events = [])],
    ["H-02", "circling_worker", (world) => (world.controls = [])],
    ["H-03", "training", (world) => (world.queues = [])],
    ["H-03", "crop", (world) => (world.initialOrders = [])],
    [
      "H-04",
      "income_parent",
      (world) => (world.actors = world.actors.filter((a) => a.fixtureActorId !== "blocked-source"))
    ],
    ["H-19", "pending", (world) => (world.routeOutages[0].mode = "null")],
    ["H-19", "error", (world) => (world.routeOutages[0].mode = "pending")],
    [
      "H-24",
      "unsafe",
      (world) => (world.actors = world.actors.filter((a) => !a.fixtureActorId.startsWith("known-danger-")))
    ],
    ["H-25", "alternative", (world) => (world.controls = [])],
    ["H-26", "threat_clears", (world) => (world.events = [])]
  ]) {
    const fixture = nativeScenarioFixture(id),
      contract = fixture.assertions[id].requiredNativeScenario;
    const variant = fixture.recipe.variants.find((value) => contract.branchByVariant[value.id] === branch);
    assert.ok(variant);
    mutate(variant.presetWorld);
    assert.equal(validNativeScenarioFixture(fixture, id), false, `${id}:${branch}`);
  }
});

test("H-21 native larger-unit clearance is explicitly deferred by the user", () => {
  const manifest = JSON.parse(readFileSync(new URL("./fixtures/skirmish-v1.json", import.meta.url)));
  const row = manifest.rows.find((row) => row.id === "H-21");
  assert.equal(Object.hasOwn(nativeScenarioBindings.cases, "H-21"), false);
  assert.equal(row.runtimeRecipeDraft, undefined);
  assert.equal(row.runtimeSupport.status, "deferred_content");
  assert.equal(row.runtimeSupport.issue, 759);
  assert.match(row.runtimeSupport.reason, /User 2026-10-21/);
});
