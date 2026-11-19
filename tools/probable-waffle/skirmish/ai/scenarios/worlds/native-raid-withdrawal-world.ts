import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";
import { nativeScenarioWorld } from "./native-scenario-worlds.ts";
import { actor, melee, producer, tile } from "./native-world-geometry.ts";
import { control } from "./native-domain-worlds.ts";

/** Keep the attack and raid on separate approaches and introduce only opposing movement after launch. */
export function nativeRaidWithdrawalWorld(faction: string, branch: string): NativeScenarioWorld {
  const world = nativeScenarioWorld("RAID-02", faction, branch);
  const enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  const inheritedRoles = new Set(["own-deposit", "own-source", "ready-house", "ready-producer", "ready-granary"]);
  world.actors = world.actors.filter(
    (entry) => inheritedRoles.has(entry.fixtureActorId) || /^worker-[0-3]$/.test(entry.fixtureActorId)
  );
  world.actors.push(
    actor("main-target", enemy === "Tivara" ? "Sandhold" : "FrostForge", 1, 20, 18),
    actor("raid-target", producer(enemy), 1, 20, 35)
  );
  for (let index = 0; index < 16; index++) {
    world.actors.push(actor("reserve-" + index, melee(faction), 2, 27 + (index % 4), 21 + Math.floor(index / 4)));
  }
  for (let index = 0; index < 4; index++) {
    world.actors.push(actor("forward-" + index, melee(faction), 2, 24 + (index % 2), 34 + Math.floor(index / 2)));
  }
  for (let index = 0; index < 9; index++) {
    const role = "raid-guard-" + index;
    world.actors.push(actor(role, melee(enemy), 1, 15 + (index % 3), 44 + Math.floor(index / 3)));
    if (branch === "reinforced") {
      world.controls.push(
        control(role, role, 800, {
          kind: "move",
          worldPosition: tile(19 + (index % 3), 37 + Math.floor(index / 3))
        })
      );
    }
  }
  return world;
}
