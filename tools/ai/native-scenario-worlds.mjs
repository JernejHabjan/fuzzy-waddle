import { nativeScenarioActors, nativeScenarioTerrain } from "./native-scenario-world-layout.mjs";

/** Authoring only: concrete component inputs for the existing paused lobby runner, never an alternative simulation. */
export function nativeScenarioWorld(id, faction, branch) {
  const own = faction,
    enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  const fixtureId = `${id.toLowerCase()}-${faction.toLowerCase()}-${branch.replaceAll("_", "-")}`;
  const world = {
    fixtureId,
    requireFactionRoster: true,
    actors: nativeScenarioActors(id, own, enemy, branch),
    existingActorBindings: [
      { fixtureActorId: "original-home", actorName: own === "Tivara" ? "Sandhold" : "FrostForge", owner: 2 },
      { fixtureActorId: "enemy-home", actorName: enemy === "Tivara" ? "Sandhold" : "FrostForge", owner: 1 }
    ],
    resourceGrants: [],
    resourceStarts: [1, 2].map((playerNumber) => ({
      playerNumber,
      amounts: {
        food: id.startsWith("PLACE-") ? 0 : 1200,
        wood: 1600,
        stone: id === "WALL-01" && branch === "terrain" && playerNumber === 2 ? 4000 : 800,
        minerals: 800
      }
    })),
    controls: [],
    events: [],
    initialOrders: [],
    protectedRoutes: [],
    terrainPatches: nativeScenarioTerrain(id, branch)
  };
  const actors = new Map(world.actors.map((actor) => [actor.fixtureActorId, actor]));
  const move = (role, tick, x, y, suffix = "") =>
    world.controls.push({
      id: `move-${role}-${tick}${suffix}`,
      producerFixtureActorId: role,
      requestTick: tick,
      applicationTick: tick,
      action: { kind: "move", worldPosition: tile(x, y) }
    });
  const attack = (role, target, tick) =>
    world.controls.push({
      id: `attack-${role}-${tick}`,
      producerFixtureActorId: role,
      requestTick: tick,
      applicationTick: tick,
      action: { kind: "attack", targetFixtureActorId: target }
    });
  const loss = (role, tick) =>
    world.events.push({
      id: `loss-${role}`,
      tick,
      kind: "destroy_owned_actor",
      owner: actors.get(role).owner,
      objectName: actors.get(role).actorName,
      fixtureActorId: role
    });
  const army = [...actors.keys()].filter((role) => role.startsWith("army-"));
  const reinforcements = (count = 12) => {
    for (let index = 0; index < count; index++)
      move(`reinforcement-${index}`, 400, 25 + (index % 3), 22 + Math.floor(index / 3));
  };
  if (id === "SCOUT-02" && branch !== "visible") {
    move("contact-group", 200, branch === "hidden_position" ? 5 : 8, branch === "hidden_position" ? 10 : 8);
    if (branch === "hidden_health")
      world.events.push({
        id: "hidden-damage",
        tick: 600,
        kind: "damage_owned_actor",
        owner: 1,
        objectName: actors.get("contact-group").actorName,
        fixtureActorId: "contact-group",
        damage: 5
      });
    if (branch === "hidden_queue")
      world.controls.push({
        id: "hidden-queue",
        producerFixtureActorId: "enemy-producer",
        requestTick: 600,
        applicationTick: 600,
        action: { kind: "produce", actorName: melee(enemy) }
      });
  }
  if (id === "H-22") move("contact-group", 200, branch === "remains" ? 20 : 6, branch === "remains" ? 30 : 8);
  if (id === "SCOUT-03") attack("contact-group", "scout-probe", 200);
  if (id === "STRAT-04" && branch !== "quiet") {
    for (const [tick, x, y] of [
      [400, 30, 21],
      [600, 16, 8],
      [800, 30, 21],
      [1000, 16, 8]
    ])
      move("noise-scout", tick, x, y);
    if (branch === "real_threat") reinforcements();
  }
  if (["STRAT-05", "FIGHT-01"].includes(id) && ["reinforced", "blocked_retreat"].includes(branch)) reinforcements();
  if ((id === "STRAT-06" && branch === "damaged") || (id === "STRAT-10" && branch === "combined_loss")) {
    for (let index = 0; index < 4; index++) loss(`worker-${index}`, 200);
    if (id === "STRAT-10") {
      loss("ready-producer", 200);
      for (const role of army.slice(0, 5)) loss(role, 200);
    }
  }
  if (["STRAT-07", "RAID-01"].includes(id) && branch === "unfinished") {
    world.actors = world.actors.filter((actor) => actor.fixtureActorId !== "contact-group");
    world.constructionOrders = [
      {
        fixtureActorId: "contact-group",
        actorName: producer(enemy),
        builderFixtureActorIds: ["enemy-worker"],
        position: tile(19, 27)
      }
    ];
  }
  if (id === "STRAT-07" && branch === "breach") loss("opportunity-wall", 400);
  if (id === "STRAT-12" && branch === "own_threat") {
    for (let index = 0; index < 3; index++) attack(`reinforcement-${index}`, "own-deposit", 400);
  }
  if (["STRAT-13", "FIGHT-03"].includes(id)) {
    if (branch === "escalated" || branch === "unequal") reinforcements(3);
    if (branch === "infeasible") loss("front-target-a", id === "FIGHT-03" ? 400 : 600);
  }
  if (id === "FIGHT-01" && branch === "support_loss") loss("support-probe", 400);
  if (id === "FIGHT-01" && branch === "completed") loss("contact-group", 400);
  if (id === "FIGHT-05" && branch === "target_loss") loss("contact-group", 200);
  if (id === "FIGHT-02") {
    world.healthStarts = [{ fixtureActorId: "ranged-probe", healthPermille: 400, armourPermille: 0 }];
    attack("contact-group", "ranged-probe", 200);
  }
  if (id === "FIGHT-04") configureSupportWorld(world, faction, branch);
  if (id === "FIGHT-05" && ["stun", "slow"].includes(branch)) {
    const spellType = branch === "stun" ? "snowstorm" : "frostNova";
    const researchType = branch === "stun" ? "snowstormSpell" : "frostNovaSpell";
    // The opponent's caster dies early in this live fight. Complete research before the first tick so
    // the scripted native cast can test status application before combat removes its producer.
    world.completedResearch = [{ playerNumber: 1, researchType }];
    world.resourceGrants = [{ playerNumber: 1, amounts: { minerals: 1000, wood: 1000 } }];
    world.controls.push({
      id: "native-status",
      producerFixtureActorId: "enemy-caster",
      requestTick: 20,
      applicationTick: 20,
      action: { kind: "cast", spellType, targetFixtureActorId: "ranged-probe" }
    });
  }
  if (id === "FIGHT-05" && branch === "wall")
    world.controls.push({
      id: "block-route",
      producerFixtureActorId: "enemy-worker",
      requestTick: 400,
      applicationTick: 400,
      action: { kind: "construct", actorName: "Wall", worldPosition: tile(27, 27) }
    });
  if (id.startsWith("PLACE-") || id.startsWith("WALL-") || ["H-27", "H-28"].includes(id)) {
    const layoutRetreat = id === "PLACE-03" && branch === "layout";
    world.protectedRoutes = [
      {
        id: "worker-service",
        playerNumber: 2,
        from: tile(
          id.startsWith("WALL-") || ["H-27", "H-28"].includes(id) ? 33 : 32,
          id.startsWith("WALL-") || ["H-27", "H-28"].includes(id) ? 24 : 23
        ),
        to: tile(28, 31),
        tileMargin: 0
      },
      {
        id: "production-army",
        playerNumber: 2,
        from: tile(42, 25),
        to: tile(27, 25),
        tileMargin: ["PLACE-01", "PLACE-03"].includes(id) ? 0 : 1
      },
      {
        id: "retreat",
        playerNumber: 2,
        from: layoutRetreat ? tile(28, 28) : tile(28, 25),
        to: layoutRetreat ? tile(33, 28) : tile(33, 25),
        tileMargin: ["PLACE-01", "PLACE-03"].includes(id) ? 0 : 1
      }
    ];
    const transitTicks = ["PLACE-01", "PLACE-03"].includes(id) ? [1] : [200, 600, 1000, 1400, 1800, 2200];
    for (const [index, tick] of transitTicks.entries()) {
      if (["PLACE-01", "PLACE-03"].includes(id)) {
        // These short, on-route probes must finish before the AI's next order refresh.
        move("worker-transit", tick, 29, 30);
        move("army-transit", tick, 28, branch === "concurrent" ? 24 : 25);
      } else {
        move("worker-transit", tick, index % 2 ? 28 : 32, index % 2 ? 31 : 23);
        move("army-transit", tick, index % 2 ? 27 : 42, 25);
      }
    }
    if (["WALL-02", "H-27"].includes(id) || ["exposed", "both_exposed"].includes(branch))
      attack("contact-group", "original-home", id === "H-27" ? 20 : 200);
    if (["stairs_loss", "stairs_missing", "breach", "unreachable", "loss"].includes(branch))
      loss(
        ["breach", "repair", "loss", "changed_plan"].includes(branch) ? "perimeter-wall" : "perimeter-stair",
        branch === "stairs_missing" ? 1 : 400
      );
    if (id === "H-28" && ["changed_plan", "repair"].includes(branch))
      world.events.push({
        id: "loss-ai-wall",
        tick: 1200,
        kind: "destroy_ai_site",
        owner: 2,
        objectName: "Wall"
      });
    if (id === "WALL-04" && branch === "unreachable")
      world.controls.push({
        id: "block-stair-repair",
        producerFixtureActorId: "enemy-worker",
        requestTick: 500,
        applicationTick: 500,
        action: { kind: "construct", actorName: "Wall", worldPosition: tile(29, 22) }
      });
    if (branch === "no_value") loss("protected-deposit", 200);
    if (branch === "air") attack("air-threat", "original-home", 200);
    if (id === "WALL-05" && branch === "shore") {
      world.protectedRoutes.push({
        id: "shore-egress",
        playerNumber: 2,
        from: tile(26, 26),
        to: tile(30, 28),
        tileMargin: 0
      });
      world.controls.push({
        id: "shore-egress",
        producerFixtureActorId: "shore-transit",
        requestTick: 200,
        applicationTick: 200,
        action: { kind: "move", worldPosition: tile(30, 28) }
      });
    }
    if (branch === "unaffordable")
      world.resourceStarts.find((start) => start.playerNumber === 2).amounts = {
        food: 0,
        wood: 0,
        stone: 0,
        minerals: 0
      };
  }
  if (id === "STRAT-11" && branch === "resource")
    world.initialOrders.push({ workerFixtureActorId: "worker-0", sourceFixtureActorId: "own-source", kind: "gather" });
  if (id === "PLACE-01" && branch === "constrained") {
    world.terrainPreserveFootprints = true;
    world.protectedRoutes[0] = {
      id: "worker-service",
      playerNumber: 2,
      from: tile(32, 23),
      to: tile(34, 30),
      tileMargin: 0
    };
    for (const control of world.controls)
      if (
        control.producerFixtureActorId === "worker-transit" &&
        control.action.kind === "move" &&
        control.action.worldPosition.x === tile(28, 31).x
      )
        control.action.worldPosition = tile(34, 30);
  }
  if (
    !id.startsWith("PLACE-") &&
    id !== "H-28" &&
    !["unused", "protected"].includes(branch) &&
    !world.constructionOrders?.length &&
    actors.has("enemy-worker")
  )
    world.initialOrders.push({
      workerFixtureActorId: "enemy-worker",
      sourceFixtureActorId: "enemy-source",
      kind: "gather"
    });
  return world;
}

/** Exact 50×50 isometric tile centers, matching IsoHelper and the frozen test map's 64×32 tiles. */
export function tile(x, y, z = 0) {
  return { x: (x - y) * 32 + 32, y: (x + y) * 16 + 16, z };
}
export function melee(faction) {
  return faction === "Tivara" ? "TivaraMacemanMale" : "SkaduweeWarriorMale";
}
export function producer(faction) {
  return faction === "Tivara" ? "AnkGuard" : "InfantryInn";
}

/** Preset the ability as completed; this scenario measures native tactical effects, not research-economy timing. */
function configureSupportWorld(world, faction, branch) {
  const spell =
    branch === "zone"
      ? "firestormSpell"
      : branch === "support_expiry"
        ? "healingTotemSpell"
        : faction === "Tivara"
          ? "healingRainSpell"
          : "healingLightSpell";
  world.resourceGrants = [{ playerNumber: 2, amounts: { minerals: 1000, wood: 1000, stone: 1000 } }];
  world.completedResearch = [{ playerNumber: 2, researchType: spell }];
  world.healthStarts = [
    { fixtureActorId: "ranged-probe", healthPermille: 350, armourPermille: 0 },
    { fixtureActorId: "contact-group", healthPermille: branch === "overkill" ? 100 : 1000, armourPermille: 0 },
    ...(branch === "healing" || branch === "support_expiry" || branch === "pending_effect"
      ? [{ fixtureActorId: "support-probe", healthPermille: 350, armourPermille: 0 }]
      : [])
  ];
  if (branch === "zone") {
    const target = world.actors.find((actor) => actor.fixtureActorId === "contact-group");
    if (target) target.position = tile(28, 27);
  }
}
