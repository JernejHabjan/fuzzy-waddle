import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";
import { nativeScenarioWorld, tile, melee, producer } from "./native-scenario-worlds.ts";
import { control } from "./native-domain-worlds.ts";
import { actor, defaultContactRoles } from "./native-world-geometry.ts";

/** Recovery premises are native obstructions, jobs and paid work; no saved planner state or synthetic progress is seeded. */
export function nativeRecoveryWorld(id, faction, branch): NativeScenarioWorld {
  const world = nativeScenarioWorld(id, faction, branch),
    enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  const move = (role, tick, x, y) =>
    world.controls.push(control(`recovery-${role}-${tick}`, role, tick, { kind: "move", worldPosition: tile(x, y) }));
  world.actors = world.actors.filter((a) => !defaultContactRoles.includes(a.fixtureActorId));
  world.actors.push(actor("mission-target", "WorkMill", 1, 18, 26));
  world.actors.find((a) => a.fixtureActorId === "scout-probe").position = tile(23, 26);
  world.initialOrders.push({ workerFixtureActorId: "worker-1", sourceFixtureActorId: "own-source", kind: "gather" });
  for (let i = 0; i < 3; i++)
    world.actors.push(actor(`recovery-house-${i}`, faction === "Tivara" ? "Olival" : "Emberstone", 2, 43, 29 + i * 4));
  if (["H-01", "H-02", "H-04"].includes(id)) {
    // An enclosure keeps the original actor physically blocked after each finite service failure has expired.
    for (let x = 24; x <= 28; x++)
      for (let y = 19; y <= 23; y++)
        if (x === 24 || x === 28 || y === 19 || y === 23)
          world.terrainPatches.push({ x, y, terrain: "grass", blocked: true });
    world.actors.find((a) => a.fixtureActorId === "army-0").position = tile(26, 21);
    world.actors.push(actor("recovery-door", "Wall", 2, 24, 21));
    world.terrainPatches = world.terrainPatches.filter((p) => !(p.x === 24 && p.y === 21));
    world.events.push({
      id: "loss-recovery-door",
      tick: branch === "clears_early" || branch === "relevant_child" ? 400 : 2400,
      kind: "destroy_owned_actor",
      owner: 2,
      objectName: "Wall",
      fixtureActorId: "recovery-door"
    });
    world.routeOutages = [{ id: "original-route-outage", fromTick: 1, throughTick: 400, fixtureActorIds: ["army-0"] }];
    if (id === "H-02") {
      const role = branch === "circling_worker" ? "worker-0" : "army-0";
      if (role === "worker-0") world.actors.find((a) => a.fixtureActorId === role).position = tile(26, 21);
      if (role === "worker-0")
        world.initialOrders.push({ workerFixtureActorId: role, sourceFixtureActorId: "own-source", kind: "gather" });
      for (const [tick, x, y] of [
        [200, 25, 20],
        [400, 27, 20],
        [600, 27, 22],
        [800, 25, 22],
        [1000, 25, 20],
        [1200, 27, 20]
      ])
        move(role, tick, x, y);
    }
    if (id === "H-04" && branch === "income_parent") {
      world.actors.push(actor("blocked-source", "Tree1", null, 26, 21));
      world.actors.find((a) => a.fixtureActorId === "worker-0").position = tile(26, 20);
      world.initialOrders.push({
        workerFixtureActorId: "worker-0",
        sourceFixtureActorId: "blocked-source",
        kind: "gather"
      });
      world.actors.push(actor("unrelated-field", "Field", 2, 40, 34));
      world.initialOrders = world.initialOrders.filter((order) => order.workerFixtureActorId !== "worker-1");
      world.initialOrders.push({
        workerFixtureActorId: "worker-1",
        sourceFixtureActorId: "unrelated-field",
        kind: "gather"
      });
    }
    if (id === "H-01" && branch === "alternative_duty") {
      world.actors.push(actor("alternative-target", "WorkMill", 1, 27, 36));
      world.actors.push(actor("alternative-observer", melee(faction), 2, 29, 36));
    }
  }
  if (id === "H-03") {
    if (branch === "training" || branch === "crop") {
      const duty = new Set(
        branch === "training"
          ? ["ready-producer", "ready-house", "recovery-house-0", "own-deposit", "own-source"]
          : ["ready-granary", "own-deposit", "own-source"]
      );
      world.actors = world.actors.filter(
        (actor) => duty.has(actor.fixtureActorId) || /^worker-[01]$/.test(actor.fixtureActorId)
      );
      world.initialOrders = world.initialOrders.filter((order) => order.workerFixtureActorId !== "enemy-worker");
      const resources = world.resourceStarts.find((start) => start.playerNumber === 2);
      if (resources) resources.amounts = { food: branch === "training" ? 0 : 300, wood: 0, stone: 0, minerals: 0 };
    }
    if (branch === "training") {
      // The map AI may queue from its ordinary starting stock before this tick-zero preset runs.
      // Fund the authored paid items first, then resourceStarts clears the remaining stock below.
      world.resourceGrants.push({
        playerNumber: 2,
        amounts: { food: 180 }
      });
      // Three 100-tick units keep the last paid item beyond the watchdog's 200-tick threshold.
      world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 3 }];
    }
    if (branch === "crop") {
      world.actors.push(actor("healthy-field", "Field", 2, 35, 27));
      world.initialOrders.push({
        workerFixtureActorId: "worker-0",
        sourceFixtureActorId: "healthy-field",
        kind: "gather"
      });
    }
    if (["travel", "stalled"].includes(branch)) {
      world.actors.find((a) => a.fixtureActorId === "army-0").position = tile(45, 46);
      world.actors.find((a) => a.fixtureActorId === "mission-target").position = tile(15, 25);
      world.actors = world.actors.filter((a) => ["army-0", "mission-target"].includes(a.fixtureActorId));
      world.initialOrders = [];
      const resources = world.resourceStarts.find((start) => start.playerNumber === 2);
      if (resources) resources.amounts = { food: 0, wood: 0, stone: 0, minerals: 0 };
      if (branch === "stalled")
        world.routeOutages = [
          { id: "healthy-matched-outage", fromTick: 1, throughTick: 1001, fixtureActorIds: ["army-0"] }
        ];
    }
  }
  if (id === "H-19") {
    const h19Roles = new Set(["worker-0", "army-0", "army-1", "own-deposit", "own-source", "mission-target"]);
    world.actors = world.actors.filter((entry) => h19Roles.has(entry.fixtureActorId));
    const defense = world.actors.find((entry) => entry.fixtureActorId === "army-1");
    if (defense) defense.position = tile(29, 23);
    const resources = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (resources) resources.amounts = { food: 300, wood: 0, stone: 0, minerals: 0 };
    world.initialOrders = [{ workerFixtureActorId: "worker-0", sourceFixtureActorId: "own-source", kind: "gather" }];
    world.routeOutages = [
      {
        id: "optional-query-outage",
        fromTick: 1,
        throughTick: branch === "pending" ? 1001 : 600,
        fixtureActorIds: ["army-0"],
        mode: branch === "error" ? "error" : "pending"
      }
    ];
    world.actors.find((a) => a.fixtureActorId === "army-0").position = tile(44, 42);
    world.actors.push(actor("local-attacker", melee(enemy), 1, 30, 19));
    world.controls.push(
      control("local-real-attack", "local-attacker", 200, { kind: "attack", targetFixtureActorId: "worker-0" })
    );
  }
  if (["H-24", "H-25", "H-26"].includes(id)) configureMissionRecovery(world, id, faction, enemy, branch, actor, move);
  return world;
}

/** Fixed opponent pressure exposes a real choke, leaving branch-specific alternatives without commanding the AI response. */
function configureMissionRecovery(world, id, faction, enemy, branch, actor, move) {
  if (["H-24", "H-26"].includes(id)) world.actors.find((a) => a.fixtureActorId === "worker-1").position = tile(32, 32);
  if (id === "H-24") {
    for (let i = 0; i < 16; i++)
      world.actors.push(actor(`hidden-force-${i}`, melee(enemy), 1, 4 + (i % 4), 9 + Math.floor(i / 4)));
    world.actors.find((a) => a.fixtureActorId === "mission-target").actorName =
      branch === "raid" ? `${enemy}WorkerMale` : branch === "denial" ? producer(enemy) : "WorkMill";
    if (branch === "raid" || branch === "denial") {
      // Start this bounded decision at the contact line. A long cross-map march lets unrelated
      // defense/scouting decisions consume the evidence window before the small opportunity is tested.
      for (const [role, x, y] of [
        ["army-0", 23, 26],
        ["army-1", 23, 27],
        ["army-2", 24, 27]
      ])
        world.actors.find((actor) => actor.fixtureActorId === role).position = tile(x, y);
    }
    if (branch === "denial")
      world.actors.find((actor) => actor.fixtureActorId === "mission-target").position = tile(24, 25);
    if (branch === "unsafe")
      for (let i = 0; i < 4; i++)
        // Keep the towers visible around the opportunity but outside their opening weapon envelope.
        world.actors.push(actor(`known-danger-${i}`, "WatchTower", 1, 14 + i * 2, 23));
    if (branch === "information") {
      world.actors.find((a) => a.fixtureActorId === "mission-target").position = tile(20, 30);
      world.actors.find((a) => a.fixtureActorId === "scout-probe").position = tile(29, 30);
      world.actors.find((a) => a.fixtureActorId === "scout-probe").actorName =
        faction === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl";
    }
    const focusedRoles = new Set([
      "worker-1",
      "own-deposit",
      "own-source",
      "mission-target",
      "army-0",
      "army-1",
      "army-2",
      "enemy-deposit",
      "enemy-source",
      "enemy-worker"
    ]);
    if (branch === "information") focusedRoles.add("scout-probe");
    world.actors = world.actors.filter(
      ({ fixtureActorId }) =>
        focusedRoles.has(fixtureActorId) ||
        fixtureActorId.startsWith("hidden-force-") ||
        (branch === "unsafe" && fixtureActorId.startsWith("known-danger-"))
    );
    world.initialOrders = world.initialOrders.filter((order) => order.workerFixtureActorId === "worker-1");
    const resources = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (resources) resources.amounts = { food: 300, wood: 0, stone: 0, minerals: 0 };
    return;
  }
  // The two land approaches are authored separately so each H-26 branch proves one route policy.
  for (let y = 0; y < 50; y++)
    for (const x of [24, 25]) {
      if ((y >= 23 && y <= 26) || (id === "H-26" && branch === "safe_alternate" && y >= 37 && y <= 40)) continue;
      world.terrainPatches.push({ x, y, terrain: "water", blocked: false });
    }
  const chokeGuardCount = id === "H-26" && branch === "grouping" ? 1 : 4;
  for (let i = 0; i < chokeGuardCount; i++)
    world.actors.push(actor(`choke-guard-${i}`, "WatchTower", 1, id === "H-26" ? 20 : 21, 20 + i * 3));
  world.actors.find((a) => a.fixtureActorId === "mission-target").position = tile(17, 26);
  if (id !== "H-26" || branch === "safe_alternate")
    world.actors.push(actor("alternative-target", "WorkMill", 1, 18, 39));
  if (id === "H-25") {
    for (let i = 0; i < 8; i++) {
      world.actors.push(actor(`pressure-${i}`, melee(enemy), 1, 18 + (i % 4), 23 + Math.floor(i / 4)));
      for (const tick of [400, 1200, 2000]) {
        move(`pressure-${i}`, tick, 27 + (i % 3), 24 + Math.floor(i / 3));
        move(`pressure-${i}`, tick + 400, 18 + (i % 4), 23 + Math.floor(i / 4));
      }
    }
    if (branch === "changed_force")
      world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    if (branch === "no_alternative")
      world.actors = world.actors.filter(
        (a) => !["alternative-target", "alternative-observer"].includes(a.fixtureActorId)
      );
  }
  if (id === "H-26") {
    const noSafeRoute = branch === "no_safe_route";
    const missionTarget = world.actors.find((candidate) => candidate.fixtureActorId === "mission-target");
    missionTarget.actorName = enemy === "Tivara" ? "Sandhold" : "FrostForge";
    missionTarget.position = tile(14, 36);
    world.actors.find((candidate) => candidate.fixtureActorId === "army-0").position = tile(12, 36);
    world.actors.find((candidate) => candidate.fixtureActorId === "scout-probe").actorName =
      faction === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl";
    world.actors.find((candidate) => candidate.fixtureActorId === "scout-probe").position = tile(23, 36);
    world.actors.find((candidate) => candidate.fixtureActorId === "ready-producer").position = tile(35, 32);
    world.actors.find((candidate) => candidate.fixtureActorId === "ready-house").position = tile(38, 32);
    const focusedRoles = new Set([
      "ready-producer",
      "ready-house",
      "army-0",
      "scout-probe",
      "mission-target",
      "own-source",
      "own-deposit",
      ...Array.from({ length: 6 }, (_, index) => `worker-${index}`),
      ...(branch === "safe_alternate" ? ["alternative-target"] : [])
    ]);
    world.actors = world.actors.filter(
      (candidate) => focusedRoles.has(candidate.fixtureActorId) || candidate.fixtureActorId.startsWith("choke-guard-")
    );
    for (let index = 0; index < 6; index++) {
      world.actors.find((candidate) => candidate.fixtureActorId === `worker-${index}`).position = tile(
        38 + (index % 3),
        12 + Math.floor(index / 3)
      );
    }
    world.actors.find((candidate) => candidate.fixtureActorId === "own-source").position = tile(37, 16);
    world.actors.find((candidate) => candidate.fixtureActorId === "own-deposit").position = tile(42, 16);
    // The stock map contributes a roaming starting combatant outside the authored recovery world.
    // Bind and remove it before the first AI decision so only this scenario's army and threat matter.
    const mapCombatants =
      faction === "Tivara"
        ? [
            { fixtureActorId: "map-starting-maceman", actorName: "TivaraMacemanMale", owner: 2 },
            { fixtureActorId: "map-opponent-magician", actorName: "SkaduweeMagicianFemale", owner: 1 }
          ]
        : [{ fixtureActorId: "map-starting-magician", actorName: "SkaduweeMagicianFemale", owner: 2 }];
    world.existingActorBindings.push(...mapCombatants);
    world.events.push(
      ...mapCombatants.map((combatant) => ({
        id: `remove-${combatant.fixtureActorId}`,
        tick: 1,
        kind: "destroy_owned_actor" as const,
        owner: combatant.owner,
        objectName: combatant.actorName,
        fixtureActorId: combatant.fixtureActorId
      }))
    );
    // The authored enemy core keeps the opponent alive and is the sole strategic objective.
    world.events.push({
      id: "remove-map-enemy-home",
      tick: 1,
      kind: "destroy_owned_actor",
      owner: 1,
      objectName: missionTarget.actorName,
      fixtureActorId: "enemy-home"
    });
    world.initialOrders = Array.from({ length: 6 }, (_, index) => ({
      workerFixtureActorId: `worker-${index}`,
      sourceFixtureActorId: "own-source",
      kind: "gather" as const
    }));
    if (noSafeRoute) {
      const resources = world.resourceStarts.find((entry) => entry.playerNumber === 2);
      if (resources) resources.amounts = { food: 240, wood: 0, stone: 0, minerals: 0 };
    }
    world.resourceGrants.push({ playerNumber: 2, amounts: { food: 40 } });
    world.queues = [
      { producerFixtureActorId: "ready-producer", actorName: melee(faction), count: noSafeRoute ? 1 : 4 }
    ];
    // Keep the existing main front separate from the paid force; an actual scout starts at the lower-route decision.
    world.productionRallies = [
      { producerObjectName: producer(faction), owner: 2, targetFixtureActorId: "ready-house" }
    ];
    if (branch === "threat_clears")
      for (let i = 0; i < 4; i++)
        world.events.push({
          id: `loss-choke-guard-${i}`,
          tick: 200,
          kind: "destroy_owned_actor",
          owner: 1,
          objectName: "WatchTower",
          fixtureActorId: `choke-guard-${i}`
        });
  }
}
