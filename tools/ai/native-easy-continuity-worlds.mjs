import { nativeDifficultyWorld } from "./native-difficulty-worlds.mjs";
import { melee, tile } from "./native-scenario-worlds.mjs";
import { control } from "./native-domain-worlds.mjs";

/** Easy earns its army before an observed counterforce arrives, withdraws and exposes renewed pressure. */
export function nativeEasyContinuityWorld(faction, branch) {
  const world = nativeDifficultyWorld(faction, branch), enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  // Preserve the ordinary faction start and 200-resource bank; Easy must earn workers, housing and production itself.
  world.actors = [];
  world.initialOrders = [];
  world.resourceStarts = [];
  world.actors.push({ fixtureActorId: "continuity-target", actorName: "WorkMill", owner: 1, position: tile(20, 27) });
  for (let i = 0; i < 12; i++) {
    const role = `continuity-counter-${i}`;
    world.actors.push({ fixtureActorId: role, actorName: melee(enemy), owner: 1,
      position: tile(5 + i % 4, 8 + Math.floor(i / 4)) });
    world.controls.push(control(`counter-arrive-${i}`, role, 2600,
      { kind: "move", worldPosition: tile(25 + i % 4, 24 + Math.floor(i / 4)) }),
    control(`counter-attack-${i}`, role, 3000, { kind: "attack", targetFixtureActorId: "original-home" }),
    control(`counter-leave-${i}`, role, 5000,
      { kind: "move", worldPosition: tile(5 + i % 4, 8 + Math.floor(i / 4)) }));
  }
  world.events.push({ id: "continuity-worker-loss", tick: 3200, kind: "destroy_owned_actor", owner: 2,
    objectName: `${faction}WorkerMale` });
  return world;
}
