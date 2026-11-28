import type { NativeActorLayoutContext } from "../../contracts/scenarios/native-actor-layout-context.ts";
import { configureNativeContactActors } from "./setup/native-contact-actors.ts";
import { configureNativePlacementActors } from "./setup/native-placement-actors.ts";
import { configureNativeCombatActors } from "./setup/native-combat-actors.ts";
import { configureNativeObjectiveActors } from "./setup/native-objective-actors.ts";
import type { NativeScenarioActor } from "../../contracts/scenarios/native-scenario-actor.ts";
/** Concrete role/position authoring; effective capabilities and prices are still resolved by the real runtime. */
export function nativeScenarioActors(id: string, own: string, enemy: string, branch: string): NativeScenarioActor[] {
  const tile = (x, y) => ({ x: (x - y) * 32 + 32, y: (x + y) * 16 + 16, z: 0 });
  const actor = (fixtureActorId, actorName, owner, x, y) => ({
    fixtureActorId,
    actorName,
    owner,
    position: tile(x, y)
  });
  const melee = (faction) => (faction === "Tivara" ? "TivaraMacemanMale" : "SkaduweeWarriorMale");
  const ranged = (faction) => (faction === "Tivara" ? "TivaraSlingshotFemale" : "SkaduweeRangedFemale");
  const producer = (faction) => (faction === "Tivara" ? "AnkGuard" : "InfantryInn");
  const caster = (faction) => (faction === "Tivara" ? "TivaraSlingshotFemale" : "SkaduweeMagicianFemale");
  const scouting = id.startsWith("SCOUT-") || id === "H-22",
    placement = id.startsWith("PLACE-");
  const wall = id.startsWith("WALL-") || ["H-27", "H-28"].includes(id);
  const hidden = id === "SCOUT-01" || id === "SCOUT-04";
  const target =
    id === "FIGHT-01"
      ? enemy === "Tivara"
        ? "Sandhold"
        : "FrostForge"
      : id === "RAID-01" && branch === "expansion"
        ? melee(enemy)
        : id === "SCOUT-02"
          ? enemy === "Tivara"
            ? "TivaraAlchemist"
            : "SkaduweeOwl"
          : id === "SCOUT-01"
            ? producer(enemy)
            : id === "SCOUT-04" && branch === "producer"
              ? producer(enemy)
              : id === "SCOUT-04" || ["STRAT-07", "STRAT-12", "RAID-01"].includes(id)
                ? "WorkMill"
                : melee(enemy);
  const actors = [
    ...Array.from(
      { length: ["SCOUT-01", "SCOUT-04"].includes(id) ? 1 : placement ? 16 : id === "WALL-02" ? 2 : 8 },
      (_, i) => actor(`worker-${i}`, `${own}WorkerMale`, 2, 32 + (i % 4), 21 + Math.floor(i / 4))
    ),
    ...Array.from({ length: scouting || placement || id === "WALL-02" ? 0 : id === "FIGHT-01" ? 2 : 8 }, (_, i) => {
      const strat13Group = Math.floor(i / 4),
        strat13Index = i % 4;
      return actor(
        `army-${i}`,
        id === "STRAT-13" ? (strat13Index < 2 ? melee(own) : ranged(own)) : i < 6 ? melee(own) : ranged(own),
        2,
        id === "STRAT-13" ? 25 + (strat13Index % 2) : 29 + (i % 4),
        id === "STRAT-13" ? (strat13Group === 0 ? 17 : 31) + Math.floor(strat13Index / 2) : 25 + Math.floor(i / 4)
      );
    }),
    actor("ready-producer", producer(own), 2, 37, 23),
    actor("ready-house", own === "Tivara" ? "Olival" : "Emberstone", 2, 39, 18),
    ...(id === "WALL-02"
      ? [
          actor("housing-buffer-a", own === "Tivara" ? "Olival" : "Emberstone", 2, 35, 14),
          actor("housing-buffer-b", own === "Tivara" ? "Olival" : "Emberstone", 2, 38, 14)
        ]
      : []),
    actor("own-deposit", "WorkMill", 2, 32, 30),
    actor("own-source", "Tree1", null, 32, 34),
    actor("ready-granary", "Granary", 2, 38, 29),
    actor(
      "scout-probe",
      ["SCOUT-01", "WALL-02"].includes(id) ? (own === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl") : melee(own),
      2,
      hidden ? 30 : 27,
      24
    ),
    actor("ranged-probe", ranged(own), 2, 30, 27),
    actor("support-probe", id === "FIGHT-01" ? ranged(own) : caster(own), 2, 32, 27),
    actor("contact-group", target, 1, hidden ? (branch === "hidden_b" ? 10 : 12) : 23, hidden ? 28 : 24),
    actor("enemy-producer", producer(enemy), 1, 12, 18),
    actor("enemy-deposit", "WorkMill", 1, 17, 28),
    actor("enemy-source", "Tree1", null, 17, 32),
    actor("enemy-worker", `${enemy}WorkerMale`, 1, 18, 30),
    actor("front-target-a", producer(enemy), 1, 20, 16),
    actor("front-target-b", producer(enemy), 1, 20, 34),
    actor("noise-scout", `${enemy}WorkerMale`, 1, 16, 8)
  ];
  const context: NativeActorLayoutContext = {
    id,
    own,
    enemy,
    branch,
    actors,
    wall,
    placement,
    tile,
    actor,
    melee,
    ranged,
    producer,
    caster
  };
  configureNativeContactActors(context);
  configureNativePlacementActors(context);
  if (id === "PLACE-02")
    return actors.filter(({ fixtureActorId }) =>
      [
        "worker-0",
        "worker-1",
        "worker-2",
        "worker-3",
        "ready-granary",
        "ready-house",
        "outer-threat",
        "inner-threat"
      ].includes(fixtureActorId)
    );
  const combatRoster = configureNativeCombatActors(context);
  if (combatRoster) return combatRoster;
  configureNativeObjectiveActors(context);
  if (id === "WALL-02") actors.push(actor("frontier-scout-probe", melee(own), 2, 9, 6));
  if (id === "STRAT-05" && branch !== "blocked_retreat")
    actors.find((entry) => entry.fixtureActorId === "front-target-a").position = tile(27, 24);
  if (id === "WALL-01") {
    const requiredRoles = new Set([
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
      ...(branch === "no_value" ? [] : ["enemy-producer", "wall-approach-probe"])
    ]);
    return actors.filter((entry) => requiredRoles.has(entry.fixtureActorId));
  }
  if (id === "WALL-02") {
    const focusedRoles = new Set([
      "worker-0",
      "worker-1",
      "ready-producer",
      "ready-house",
      "housing-buffer-a",
      "housing-buffer-b",
      "own-deposit",
      "own-source",
      "ready-field-1",
      "ready-field-2",
      "ready-field-3",
      "ready-granary",
      "scout-probe",
      "frontier-scout-probe",
      "enemy-source",
      "perimeter-stair",
      "protected-deposit",
      "worker-transit",
      ...(["army", "concurrent"].includes(branch) ? ["army-transit"] : []),
      ...(branch === "enemy_opening" ? ["hostile-transit"] : [])
    ]);
    return actors.filter((entry) => focusedRoles.has(entry.fixtureActorId));
  }
  if (id === "FIGHT-01") {
    const fightRoles = new Set([
      "worker-0",
      "army-0",
      "army-1",
      "support-probe",
      "contact-group",
      "enemy-deposit",
      ...actors
        .filter((entry) => entry.fixtureActorId.startsWith("reinforcement-"))
        .map((entry) => entry.fixtureActorId)
    ]);
    return actors.filter((entry) => fightRoles.has(entry.fixtureActorId));
  }
  if (id === "SCOUT-04") {
    if (branch !== "approach") {
      actors.push(actor("scout-reserve", melee(own), 2, 34, 16));
      actors.push(actor("scout-reserve-2", melee(own), 2, 35, 16));
    }
    const distractions = new Set([
      "ready-producer",
      "ranged-probe",
      "support-probe",
      "front-target-a",
      "front-target-b",
      "noise-scout",
      "enemy-producer",
      "enemy-deposit",
      "enemy-source",
      "enemy-worker"
    ]);
    return actors.filter((entry) => !distractions.has(entry.fixtureActorId));
  }
  if (id === "SCOUT-03") {
    const roles = new Set(["scout-probe", "scout-guard", "contact-group", "ready-house", "worker-0", "worker-1"]);
    return actors.filter((entry) => roles.has(entry.fixtureActorId));
  }
  if (["SCOUT-01", "SCOUT-03"].includes(id)) {
    // Keep the scout, native base prerequisites and both scouting approaches. The extra combat probes
    // and duplicate enemy producers belong to the broader battle setups.
    const extraRoles = new Set([
      "ranged-probe",
      "support-probe",
      "front-target-a",
      "front-target-b",
      "noise-scout",
      ...(id === "SCOUT-01" ? ["enemy-producer"] : [])
    ]);
    return actors.filter((entry) => !extraRoles.has(entry.fixtureActorId));
  }
  if (id === "PLACE-01") {
    // This recipe measures multiple fields and service. Keep only the workforce that creates
    // that dated food demand plus the route probes;
    // the shared battle/economy roster otherwise grows into unrelated army and construction work.
    const roles = new Set([
      ...Array.from({ length: 6 }, (_, index) => `worker-${index}`),
      "ready-producer",
      "ready-house",
      "ready-granary",
      ...(branch === "room" ? ["field-anchor"] : []),
      "own-deposit",
      "own-source",
      "worker-transit",
      "army-transit"
    ]);
    return actors.filter((entry) => roles.has(entry.fixtureActorId));
  }
  if (id === "PLACE-03") {
    const roles = new Set([
      "worker-0",
      "worker-1",
      "worker-2",
      "worker-3",
      "ready-producer",
      "ready-house",
      "own-deposit",
      "own-source",
      "ready-granary",
      "scout-probe",
      "worker-transit",
      "army-transit",
      ...(branch === "loss" ? ["perimeter-wall"] : []),
      ...(branch === "layout" ? ["ready-field-1", "ready-field-2", "ready-field-3"] : [])
    ]);
    return actors.filter((entry) => roles.has(entry.fixtureActorId));
  }
  if (id === "STRAT-05") {
    const roles = new Set([
      "worker-0",
      ...Array.from({ length: 8 }, (_, index) => `army-${index}`),
      "contact-group",
      "front-target-a",
      "front-target-b",
      ...Array.from({ length: 12 }, (_, index) => `reinforcement-${index}`)
    ]);
    return actors.filter((entry) => roles.has(entry.fixtureActorId));
  }
  return actors;
}

/** Actual native tile geometry on the frozen open map; not a fictitious map label or an AI access-graph injection. */
export function nativeScenarioTerrain(id, branch) {
  const bridge =
    id === "WALL-05" || (id === "SCOUT-04" && branch === "approach") || (id === "STRAT-11" && branch === "bridge");
  const patches = [];
  if (bridge)
    for (let y = 0; y < 50; y++)
      for (const x of [24, 25]) {
        // The scouting approach keeps only the southern crossing executable.
        if (id === "SCOUT-04" ? y >= 34 && y <= 37 : y >= 20 && y <= 25) continue;
        patches.push({ x, y, terrain: "water", blocked: false });
      }
  if (id === "WALL-01") {
    // The first observed hostile front is four tiles east of the Sandhold (x=37).
    // Terrain anchors shorten its north-to-south span; the freestanding control must build a wider line.
    if (branch === "terrain") {
      patches.push(
        { x: 37, y: 14, terrain: "grass", blocked: true },
        { x: 37, y: 24, terrain: "grass", blocked: true }
      );
    } else {
      // Leave enough clear line between the freestanding anchors for wall segments between
      // the two tower footprints. Closer anchors let the planner choose towers with no walls.
      for (const y of [13, 25]) patches.push({ x: 37, y, terrain: "grass", blocked: true });
    }
  }
  if (id === "WALL-02") {
    // Use actual static map boundaries for the access test; already placed wall actors are
    // movable-state blockers and must not be mistaken for terrain anchors by the planner.
    patches.push({ x: 27, y: 13, terrain: "grass", blocked: true }, { x: 27, y: 24, terrain: "grass", blocked: true });
  }
  if (id === "STRAT-05" && branch === "blocked_retreat") {
    // Keep the opening target reachable, but separate the forward force from its home-side fallback.
    for (let x = 0; x < 50; x++) patches.push({ x, y: 28, terrain: "grass", blocked: true });
  } else if (branch === "trapped" || branch === "disconnected") {
    for (let x = 25; x <= 31; x++)
      for (let y = 22; y <= 28; y++)
        if (x === 25 || x === 31 || y === 22 || y === 28) patches.push({ x, y, terrain: "grass", blocked: true });
  }
  if (id === "STRAT-07" && branch === "breach") {
    for (let x = 18; x <= 27; x++)
      for (let y = 18; y <= 30; y++) {
        if ((x === 18 || x === 27 || y === 18 || y === 30) && !(x === 27 && y === 24))
          patches.push({ x, y, terrain: "grass", blocked: true });
      }
  }
  if (id === "PLACE-02") {
    for (let x = 0; x < 50; x++)
      for (let y = 0; y < 50; y++) {
        const farmPad = y >= 27 && y <= 29 && ((x >= 34 && x <= 36) || (x >= 40 && x <= 42));
        const workerLane =
          (y === 25 && x >= 33 && x <= 43) || (y === 26 && [35, 38, 41].includes(x)) || (x === 38 && y === 27);
        const homeConnection = x === 33 && y >= 21 && y <= 25;
        if (!farmPad && !workerLane && !homeConnection) patches.push({ x, y, terrain: "grass", blocked: true });
      }
  }
  if (id === "PLACE-01" && branch === "room") {
    // Bound the room-positive case to one connected production pocket. Preserve its
    // army and worker-service lanes while keeping two aligned Granary-served Field plots legal.
    for (let x = 0; x < 50; x++)
      for (let y = 0; y < 50; y++) {
        const pocket = x >= 27 && x <= 47 && y >= 17 && y <= 45;
        if (!pocket) patches.push({ x, y, terrain: "grass", blocked: true });
      }
  }
  if (id === "PLACE-01" && branch === "constrained") {
    for (let x = 0; x < 50; x++)
      for (let y = 0; y < 50; y++) {
        const fieldSite = x >= 29 && x <= 31 && y >= 32 && y <= 34;
        const granaryPad = x >= 36 && x <= 38 && y >= 32 && y <= 34;
        const vertical = x >= 34 && x <= 35 && y >= 19 && y <= 33;
        const armyRoad = y >= 25 && y <= 26 && x >= 27 && x <= 44;
        const fieldRoad = y === 33 && x >= 29 && x <= 35;
        // The Granary footprint closes the field road at x=33..35,y=33. Leave a narrow
        // northern connector so the one legal Field site belongs to the Granary's ground
        // service region; without it the AI correctly rejects the site as unusable.
        const fieldServiceConnector = y === 32 && x >= 32 && x <= 35;
        if (fieldSite || granaryPad || vertical || armyRoad || fieldRoad || fieldServiceConnector) continue;
        patches.push({ x, y, terrain: "grass", blocked: true });
      }
  }
  return patches;
}
