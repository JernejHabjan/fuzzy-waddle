import { tile } from "./native-world-geometry.ts";
import type { NativeWorldSetupContext } from "../../contracts/scenarios/native-world-setup-context.ts";
import { configureNativeStrategicControls } from "./setup/native-strategic-controls.ts";
import { configureNativeCombatControls } from "./setup/native-combat-controls.ts";
import { configureNativeConstructionControls } from "./setup/native-construction-controls.ts";
import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";
import { nativeScenarioActors, nativeScenarioTerrain } from "./native-scenario-world-layout.ts";

/** Authoring only: concrete component inputs for the existing paused lobby runner, never an alternative simulation. */
export function nativeScenarioWorld(id: string, faction: string, branch: string): NativeScenarioWorld {
  const own = faction,
    enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  const fixtureId = `${id.toLowerCase()}-${faction.toLowerCase()}-${branch.replaceAll("_", "-")}`;
  const world: NativeScenarioWorld = {
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
  const context: NativeWorldSetupContext = {
    id,
    faction,
    branch,
    own,
    enemy,
    world,
    actors,
    army,
    move,
    attack,
    loss,
    reinforcements
  };
  configureNativeStrategicControls(context);
  configureNativeCombatControls(context);
  configureNativeConstructionControls(context);
  return world;
}

export { tile, melee, producer } from "./native-world-geometry.ts";
