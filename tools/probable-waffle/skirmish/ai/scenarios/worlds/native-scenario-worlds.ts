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
        stone: id === "WALL-01" && playerNumber === 2 ? 4000 : 800,
        minerals: 800
      }
    })),
    controls: [],
    events: [],
    initialOrders: [],
    protectedRoutes: [],
    terrainPatches: nativeScenarioTerrain(id, branch)
  };
  if (id === "PLACE-02") {
    world.terrainPreserveFootprints = true;
    const placementBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (placementBank) placementBank.amounts = { food: 0, wood: 80, stone: 0, minerals: 0 };
  }
  if (id === "PLACE-01") {
    const placementBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (placementBank) placementBank.amounts = { food: 0, wood: 120, stone: 0, minerals: 0 };
  }
  if (id === "PLACE-03") {
    const layoutBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (layoutBank)
      layoutBank.amounts = {
        food: 350,
        wood: 600,
        stone: 200,
        minerals: 0
      };
  }
  if (id === "WALL-01") {
    const fortificationBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (fortificationBank)
      fortificationBank.amounts = {
        food: 300,
        wood: 0,
        stone: 4000,
        minerals: 0
      };
  }
  if (id === "WALL-02") {
    const wallBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (wallBank) wallBank.amounts.stone = 4000;
  }
  if (["PLACE-01", "PLACE-03", "WALL-01"].includes(id) && own === "Tivara")
    world.events.push({
      id: "remove-unrelated-opponent-caster",
      tick: 1,
      kind: "destroy_owned_actor",
      owner: 1,
      objectName: "SkaduweeMagicianFemale"
    });
  if (id === "WALL-01" && own === "Skaduwee")
    world.events.push({
      id: "remove-unrelated-opponent-infantry",
      tick: 1,
      kind: "destroy_owned_actor",
      owner: 1,
      objectName: "TivaraMacemanMale"
    });
  if (id === "WALL-02" && branch !== "enemy_opening")
    world.events.push({
      id: "remove-unrelated-opponent-combatant",
      tick: 1,
      kind: "destroy_owned_actor",
      owner: 1,
      objectName: enemy === "Tivara" ? "TivaraMacemanMale" : "SkaduweeMagicianFemale"
    });
  if (id === "FIGHT-01") {
    const fightBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (fightBank) fightBank.amounts = { food: 0, wood: 0, stone: 0, minerals: 0 };
  }
  if (id === "STRAT-05") {
    const opponentBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (opponentBank) opponentBank.amounts = { food: 300, wood: 0, stone: 0, minerals: 0 };
  }
  if (id === "SCOUT-03") {
    const scoutingBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (scoutingBank) scoutingBank.amounts = { food: 0, wood: 0, stone: 0, minerals: 0 };
  }
  if (id === "SCOUT-01") {
    const scoutingBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (scoutingBank) scoutingBank.amounts = { food: 300, wood: 0, stone: 0, minerals: 0 };
  }
  if (id === "SCOUT-04") {
    // Preserve starting upkeep without funding a new base that could reveal the target before the scout arrives.
    const scoutingBank = world.resourceStarts.find((entry) => entry.playerNumber === 2);
    if (scoutingBank) scoutingBank.amounts = { food: 300, wood: 0, stone: 0, minerals: 0 };
  }
  const actors = new Map(world.actors.map((actor) => [actor.fixtureActorId, actor]));
  if (id === "PLACE-01" && branch === "room")
    world.initialOrders.push({
      workerFixtureActorId: "worker-0",
      sourceFixtureActorId: "field-anchor",
      kind: "gather"
    });
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
  const reinforcements = (count = 12, tick = 400) => {
    for (let index = 0; index < count; index++)
      move(`reinforcement-${index}`, tick, 25 + (index % 3), 22 + Math.floor(index / 3));
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
