import { nativeDifficultyWorld } from "./native-difficulty-worlds.mjs";
import { melee, tile } from "./native-scenario-worlds.mjs";

/** One policy at a time, identical paused setup; only a declared opponent input changes at tick600. */
export function nativeDifficultyFairnessWorld(faction, branch) {
  const world = nativeDifficultyWorld(faction, branch);
  const mutation = branch.split("_").slice(1).join("_");
  const enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  world.actors.push({ fixtureActorId: "hidden-probe", actorName: melee(enemy), owner: 1, position: tile(5, 8) });
  if (mutation === "position" || mutation === "contact") world.controls.push({
    id: "fairness-opponent-move", producerFixtureActorId: "hidden-probe", requestTick: 600, applicationTick: 600,
    action: { kind: "move", worldPosition: mutation === "contact" ? tile(34, 25) : tile(9, 8) }
  });
  if (mutation === "health") world.events.push({ id: "fairness-hidden-damage", tick: 600,
    kind: "damage_owned_actor", owner: 1, objectName: melee(enemy), fixtureActorId: "hidden-probe", damage: 5 });
  if (mutation === "queue") world.controls.push({ id: "fairness-hidden-queue", producerFixtureActorId: "enemy-producer",
    requestTick: 600, applicationTick: 600, action: { kind: "produce", actorName: melee(enemy) } });
  return world;
}
