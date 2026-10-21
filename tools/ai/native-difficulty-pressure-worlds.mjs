import { nativeStrategicWorld } from "./native-strategic-worlds.mjs";
import { tile, melee } from "./native-scenario-worlds.mjs";
import { control } from "./native-domain-worlds.mjs";

/** More independently visible legal objectives than any policy cap, alongside an independently urgent native attack. */
export function nativeDifficultyPressureWorld(faction, branch) {
  const world = nativeStrategicWorld("STRAT-02", faction, "quiet");
  const enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  for (let i = 0; i < 20; i++) {
    const role = `pressure-worker-${i}`;
    world.actors.push({ fixtureActorId: role, actorName: `${faction}WorkerMale`, owner: 2,
      position: tile(35 + i % 5, 38 + Math.floor(i / 5)) });
    world.controls.push(control(`pressure-new-economy-work-${i}`, role, 600,
      { kind: "move", worldPosition: tile(31 + i % 5, 36 + Math.floor(i / 5)) }));
  }
  for (let i = 0; i < 4; i++) {
    world.actors.push({ fixtureActorId: `pressure-objective-${i}`, actorName: "WorkMill", owner: 1,
      position: tile(17, 12 + i * 8) }, { fixtureActorId: `pressure-observer-${i}`, actorName: melee(faction), owner: 2,
      position: tile(22, 12 + i * 8) });
  }
  for (let i = 0; i < 3; i++) {
    world.actors.push({ fixtureActorId: `pressure-attacker-${i}`, actorName: melee(enemy), owner: 1, position: tile(8 + i, 5) });
    world.controls.push(control(`pressure-attack-${i}`, `pressure-attacker-${i}`, 600,
      { kind: "attack", targetFixtureActorId: `worker-${i}` }));
  }
  world.actors.push({ fixtureActorId: "pressure-air", actorName: enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl",
    owner: 1, position: tile(7, 7) });
  world.controls.push(control("pressure-air-arrive", "pressure-air", 400,
    { kind: "move", worldPosition: tile(30, 23) }),
  control("pressure-air-withdraw", "pressure-air", 1200, { kind: "move", worldPosition: tile(7, 7) }));
  return world;
}
