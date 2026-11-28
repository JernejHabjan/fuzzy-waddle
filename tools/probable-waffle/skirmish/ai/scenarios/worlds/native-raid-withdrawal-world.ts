import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";
import { nativeScenarioWorld } from "./native-scenario-worlds.ts";
import { actor, melee, producer, tile } from "./native-world-geometry.ts";
import { control } from "./native-domain-worlds.ts";

/** Keep the attack and raid on separate approaches and introduce only opposing movement after launch. */
export function nativeRaidWithdrawalWorld(faction: string, branch: string): NativeScenarioWorld {
  const world = nativeScenarioWorld("RAID-02", faction, branch);
  const enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  world.resourceStarts = world.resourceStarts?.map(({ playerNumber }) => ({
    playerNumber,
    amounts: { food: 0, wood: 0, stone: 0, minerals: 0 }
  }));
  world.initialOrders = [{ workerFixtureActorId: "worker-0", sourceFixtureActorId: "own-source", kind: "gather" }];
  const inheritedRoles = new Set(["own-deposit", "own-source", "ready-house", "ready-producer", "ready-granary"]);
  world.actors = world.actors.filter(
    (entry) => inheritedRoles.has(entry.fixtureActorId) || /^worker-[0-5]$/.test(entry.fixtureActorId)
  );
  const housing = faction === "Tivara" ? "Olival" : "Emberstone";
  world.actors.push(
    actor("raid-housing-a", housing, 2, 42, 16),
    actor("main-target", enemy === "Tivara" ? "Sandhold" : "FrostForge", 1, 20, 14),
    actor("raid-target", producer(enemy), 1, 22, 37)
  );
  for (let index = 0; index < 8; index++) {
    world.actors.push(actor("reserve-" + index, melee(faction), 2, 27 + (index % 4), 15 + Math.floor(index / 4)));
  }
  for (let index = 0; index < 4; index++) {
    world.actors.push(actor("forward-" + index, melee(faction), 2, 25 + (index % 2), 36 + Math.floor(index / 2)));
  }
  for (let index = 0; index < 5; index++) {
    const role = "raid-guard-" + index;
    // Keep the counterforce outside both factions' opening vision. The raid must first hit its
    // objective; only the tick-200 move should reveal the guards and create the withdrawal test.
    const initialX = branch === "quiet" ? 6 : faction === "Tivara" ? 8 : 12;
    const initialY = branch === "quiet" || faction === "Tivara" ? 42 : 38;
    world.actors.push(actor(role, melee(enemy), 1, initialX + (index % 3), initialY + Math.floor(index / 3)));
    if (branch === "reinforced") {
      world.controls.push(
        control(role, role, 200, {
          kind: "move",
          worldPosition: tile(17 + (index % 3), 39 + Math.floor(index / 3))
        })
      );
    }
  }
  return world;
}
