import { nativeScenarioWorld, tile, melee, producer } from "./native-scenario-worlds.mjs";
import { control } from "./native-domain-worlds.mjs";

/** Recovery premises are native obstructions, jobs and paid work; no saved planner state or synthetic progress is seeded. */
export function nativeRecoveryWorld(id, faction, branch) {
  const world = nativeScenarioWorld(id, faction, branch), enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  const actor = (role, name, owner, x, y) => ({ fixtureActorId: role, actorName: name, owner, position: tile(x, y) });
  const move = (role, tick, x, y) => world.controls.push(control(`recovery-${role}-${tick}`, role, tick,
    { kind: "move", worldPosition: tile(x, y) }));
  world.actors = world.actors.filter((a) => !["contact-group", "noise-scout", "front-target-a", "front-target-b"].includes(a.fixtureActorId));
  world.actors.push(actor("mission-target", "WorkMill", 1, 18, 26));
  world.actors.find((a) => a.fixtureActorId === "scout-probe").position = tile(23, 26);
  world.initialOrders.push({ workerFixtureActorId: "worker-1", sourceFixtureActorId: "own-source", kind: "gather" });
  for (let i = 0; i < 3; i++) world.actors.push(actor(`recovery-house-${i}`,
    faction === "Tivara" ? "Olival" : "Emberstone", 2, 43, 29 + i * 4));
  if (["H-01", "H-02", "H-04"].includes(id)) {
    // An enclosure keeps the original actor physically blocked after each finite service failure has expired.
    for (let x = 24; x <= 28; x++) for (let y = 19; y <= 23; y++)
      if (x === 24 || x === 28 || y === 19 || y === 23)
        world.terrainPatches.push({ x, y, terrain: "grass", blocked: true });
    world.actors.find((a) => a.fixtureActorId === "army-0").position = tile(26, 21);
    world.actors.push(actor("recovery-door", "Wall", 2, 24, 21));
    world.terrainPatches = world.terrainPatches.filter((p) => !(p.x === 24 && p.y === 21));
    world.events.push({ id: "loss-recovery-door", tick: branch === "clears_early" || branch === "relevant_child" ? 400 : 2400,
      kind: "destroy_owned_actor", owner: 2, objectName: "Wall", fixtureActorId: "recovery-door" });
    world.routeOutages = [{ id: "original-route-outage", fromTick: 1, throughTick: 400, fixtureActorIds: ["army-0"] }];
    if (id === "H-02") {
      const role = branch === "circling_worker" ? "worker-0" : "army-0";
      if (role === "worker-0") world.actors.find((a) => a.fixtureActorId === role).position = tile(26, 21);
      if (role === "worker-0") world.initialOrders.push({ workerFixtureActorId: role,
        sourceFixtureActorId: "own-source", kind: "gather" });
      for (const [tick, x, y] of [[200, 25, 20], [400, 27, 20], [600, 27, 22], [800, 25, 22],
        [1000, 25, 20], [1200, 27, 20]]) move(role, tick, x, y);
    }
    if (id === "H-04" && branch === "income_parent") {
      world.actors.push(actor("blocked-source", "Tree1", null, 26, 21));
      world.actors.find((a) => a.fixtureActorId === "worker-0").position = tile(26, 20);
      world.initialOrders.push({ workerFixtureActorId: "worker-0", sourceFixtureActorId: "blocked-source", kind: "gather" });
      world.actors.push(actor("unrelated-field", "Field", 2, 40, 34));
      world.initialOrders = world.initialOrders.filter((order) => order.workerFixtureActorId !== "worker-1");
      world.initialOrders.push({ workerFixtureActorId: "worker-1", sourceFixtureActorId: "unrelated-field", kind: "gather" });
    }
    if (id === "H-01" && branch === "alternative_duty") {
      world.actors.push(actor("alternative-target", "WorkMill", 1, 27, 36));
      world.actors.push(actor("alternative-observer", melee(faction), 2, 29, 36));
    }
  }
  if (id === "H-03") {
    if (branch === "training") world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    if (branch === "crop") {
      world.actors.push(actor("healthy-field", "Field", 2, 40, 34));
      world.initialOrders.push({ workerFixtureActorId: "worker-0", sourceFixtureActorId: "healthy-field", kind: "gather" });
    }
    if (["travel", "stalled"].includes(branch)) {
      world.actors.find((a) => a.fixtureActorId === "army-0").position = tile(46, 44);
      world.actors.find((a) => a.fixtureActorId === "mission-target").position = tile(5, 5);
      if (branch === "stalled") world.routeOutages = [{ id: "healthy-matched-outage", fromTick: 1,
        throughTick: 1001, fixtureActorIds: ["army-0"] }];
    }
  }
  if (id === "H-19") {
    world.routeOutages = [{ id: "optional-query-outage", fromTick: 1, throughTick: branch === "late" ? 600 : 1001,
      fixtureActorIds: ["army-0"], mode: branch === "error" ? "error" : "pending" }];
    world.actors.find((a) => a.fixtureActorId === "army-0").position = tile(44, 42);
    world.actors.push(actor("local-attacker", melee(enemy), 1, 30, 19));
    world.controls.push(control("local-real-attack", "local-attacker", 200,
      { kind: "attack", targetFixtureActorId: "worker-0" }));
  }
  if (["H-24", "H-25", "H-26"].includes(id)) configureMissionRecovery(world, id, faction, enemy, branch, actor, move);
  return world;
}

/** Fixed opponent pressure exposes a real choke, leaving branch-specific alternatives without commanding the AI response. */
function configureMissionRecovery(world, id, faction, enemy, branch, actor, move) {
  if (id === "H-24") {
    for (let i = 0; i < 16; i++) world.actors.push(actor(`hidden-force-${i}`, melee(enemy), 1, 4 + i % 4, 9 + Math.floor(i / 4)));
    world.actors.find((a) => a.fixtureActorId === "mission-target").actorName =
      branch === "raid" ? `${enemy}WorkerMale` : branch === "denial" ? producer(enemy) : "WorkMill";
    if (branch === "unsafe") for (let i = 0; i < 8; i++)
      world.actors.push(actor(`known-danger-${i}`, "WatchTower", 1, 17 + i % 4 * 2, 23 + Math.floor(i / 4) * 4));
    if (branch === "information") {
      world.actors.find((a) => a.fixtureActorId === "mission-target").position = tile(13, 30);
      world.actors.find((a) => a.fixtureActorId === "scout-probe").position = tile(29, 30);
    }
    return;
  }
  // Cross-map water barrier has two physical land approaches; closing the southern one is an authored negative control.
  for (let y = 0; y < 50; y++) for (const x of [24, 25]) {
    if (y >= 23 && y <= 26 || branch !== "no_alternative" && branch !== "no_safe_route" && y >= 37 && y <= 40) continue;
    world.terrainPatches.push({ x, y, terrain: "water", blocked: false });
  }
  for (let i = 0; i < 4; i++) world.actors.push(actor(`choke-guard-${i}`, "WatchTower", 1, 21, 20 + i * 3));
  world.actors.find((a) => a.fixtureActorId === "mission-target").position = tile(17, 26);
  world.actors.push(actor("alternative-target", "WorkMill", 1, 18, 39));
  world.actors.push(actor("alternative-observer", melee(faction), 2, 22, 39));
  if (id === "H-25") {
    for (let i = 0; i < 8; i++) {
      world.actors.push(actor(`pressure-${i}`, melee(enemy), 1, 18 + i % 4, 23 + Math.floor(i / 4)));
      for (const tick of [400, 1200, 2000]) {
        move(`pressure-${i}`, tick, 27 + i % 3, 24 + Math.floor(i / 3));
        move(`pressure-${i}`, tick + 400, 18 + i % 4, 23 + Math.floor(i / 4));
      }
    }
    if (branch === "changed_force") world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    if (branch === "no_alternative") world.actors = world.actors.filter((a) =>
      !["alternative-target", "alternative-observer"].includes(a.fixtureActorId));
  }
  if (id === "H-26") {
    for (const a of world.actors.filter((a) => a.fixtureActorId.startsWith("army-")))
      a.position = tile(18 + Number(a.fixtureActorId.split("-")[1]) % 3, 30 + Math.floor(Number(a.fixtureActorId.split("-")[1]) / 3));
    world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    // Rally toward the owned front-line member; enemy objectives are not legal shared rally targets.
    world.productionRallies = [{ producerObjectName: producer(faction), owner: 2, targetFixtureActorId: "army-0" }];
    if (branch === "threat_clears") for (let i = 0; i < 4; i++) world.events.push({ id: `loss-choke-guard-${i}`,
      tick: 1200, kind: "destroy_owned_actor", owner: 1, objectName: "WatchTower", fixtureActorId: `choke-guard-${i}` });
  }
}
