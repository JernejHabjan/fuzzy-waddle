import { nativeScenarioWorld, tile, melee } from "./native-scenario-worlds.mjs";

/** Native water/flight choices keep real faction catalogs and never seed a foreign purchasable ship. */
export function nativeDomainWorld(id, faction, branch) {
  const world = nativeScenarioWorld(id, faction, branch), enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  const actor = (role, name, owner, x, y) => ({ fixtureActorId: role, actorName: name, owner, position: tile(x, y) });
  for (let i = 0; i < 2; i++) world.actors.push(actor(`reserve-house-${i}`,
    faction === "Tivara" ? "Olival" : "Emberstone", 2, 42, 35 + i * 4));
  world.actors = world.actors.filter((a) => !a.fixtureActorId.startsWith("front-target-") && a.fixtureActorId !== "noise-scout");
  const target = world.actors.find((a) => a.fixtureActorId === "contact-group");
  if (id === "DOMAIN-05") {
    world.actors.push(actor("air-producer", faction === "Tivara" ? "Temple" : "Owlery", 2, 37, 35));
    target.actorName = branch === "no_value" ? `${enemy}WorkerMale` : "WorkMill";
    target.position = tile(18, 30);
    world.actors.find((a) => a.fixtureActorId === "scout-probe").position = tile(23, 30);
    for (let y = 15; y <= 42; y++) world.terrainPatches.push({ x: 24, y, terrain: "grass", blocked: true });
    if (branch === "anti_air") for (let i = 0; i < 4; i++)
      world.actors.push(actor(`anti-air-${i}`, "WatchTower", 1, 18 + i % 2 * 4, 27 + Math.floor(i / 2) * 5));
    if (branch === "no_value") target.position = tile(29, 26);
    return world;
  }
  // A connected river has a land crossing; the positive naval mission is coastal, never an island-only substitute.
  for (let x = 26; x <= 28; x++) for (let y = 3; y <= 43; y++) {
    if (y >= 23 && y <= 25) continue;
    world.terrainPatches.push({ x, y, terrain: "water", blocked: false });
  }
  world.actors.find((a) => a.fixtureActorId === "scout-probe").position = tile(29, 30);
  target.actorName = "WorkMill";
  target.position = tile(25, branch === "irrelevant" || branch === "unsupported" ? 24 : 35);
  if (branch === "irrelevant" || branch === "unsupported") {
    target.position = tile(32, 25);
    world.actors.find((a) => a.fixtureActorId === "scout-probe").position = tile(32, 24);
  }
  if (id === "DOMAIN-02") {
    world.existingActorBindings.push({ fixtureActorId: "third-home", actorName: "Sandhold", owner: 3 });
    if (["intercept", "escort"].includes(branch)) {
      target.actorName = "VikingBoat";
      target.owner = 3;
      target.position = tile(26, 35);
    }
  }
  if (branch === "unreachable") {
    target.position = tile(7, 7);
    for (let x = 4; x <= 10; x++) for (let y = 4; y <= 10; y++)
      if (x === 4 || x === 10 || y === 4 || y === 10)
        world.terrainPatches.push({ x, y, terrain: "grass", blocked: true });
  }
  if (branch === "escort" || branch === "intercept") {
    world.actors.push(actor("escort-carrier", "CommonBoat", 2, 28, 12), actor("escort-worker", `${faction}WorkerMale`, 2, 29, 12));
    world.controls.push(control("escort-board", "escort-worker", 100, { kind: "board", targetFixtureActorId: "escort-carrier" }),
      control("escort-sail", "escort-carrier", 600, { kind: "move", worldPosition: tile(28, 32) }),
      control("escort-unload", "escort-carrier", 1200, { kind: "unload", worldPosition: tile(29, 32) }),
      control("escort-attack", "contact-group", 800, { kind: "attack", targetFixtureActorId: "escort-carrier" }));
  }
  return world;
}

/** Four real passengers board, traverse water and unload before attacking. Available only to a Tivara opponent. */
export function addNativeBoatRaid(world) {
  world.actors = world.actors.filter((actor) => !actor.fixtureActorId.startsWith("raider-"));
  world.controls = world.controls.filter((entry) => !entry.producerFixtureActorId.startsWith("raider-"));
  world.actors.push({ fixtureActorId: "raid-carrier", actorName: "CommonBoat", owner: 1, position: tile(10, 7) });
  for (let x = 8; x <= 29; x++) for (let y = 5; y <= 19; y++)
    world.terrainPatches.push({ x, y, terrain: "water", blocked: false });
  for (let i = 0; i < 4; i++) {
    world.actors.push({ fixtureActorId: `raider-${i}`, actorName: melee("Tivara"), owner: 1, position: tile(7, 6 + i) });
    world.controls.push(control(`raid-board-${i}`, `raider-${i}`, 100,
      { kind: "board", targetFixtureActorId: "raid-carrier" }),
    control(`raid-attack-${i}`, `raider-${i}`, 700, { kind: "attack", targetFixtureActorId: `worker-${i}` }));
  }
  world.controls.push(control("raid-sail", "raid-carrier", 500, { kind: "move", worldPosition: tile(30, 20) }),
    control("raid-unload", "raid-carrier", 680, { kind: "unload", worldPosition: tile(30, 21) }));
}

export function control(id, role, tick, action) {
  return { id, producerFixtureActorId: role, requestTick: tick, applicationTick: tick, action };
}
