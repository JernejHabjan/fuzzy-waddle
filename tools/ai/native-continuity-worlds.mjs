import { readFileSync } from "node:fs";
import { nativeScenarioWorld, tile, melee } from "./native-scenario-worlds.mjs";
import { control } from "./native-domain-worlds.mjs";

/** Each sequence retains one actual scene across its losses, new evidence and recovery; no concatenated match evidence. */
export function nativeContinuityWorld(id, faction, branch) {
  const enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  if (id === "SEQ-03") return economySequence(faction, branch);
  const world = nativeScenarioWorld(id === "SEQ-06" ? "WALL-04" : "STRAT-05", faction,
    id === "SEQ-06" ? "breach" : "reinforced");
  if (id === "SEQ-04") {
    world.controls = [];
    world.events = ["ready-house", "ready-producer"].map((role) => ({ id: `sequence-loss-${role}`, tick: 200,
      kind: "destroy_owned_actor", owner: 2, objectName: world.actors.find((actor) => actor.fixtureActorId === role).actorName,
      fixtureActorId: role }));
    world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    world.resourceStarts.find((entry) => entry.playerNumber === 2).amounts =
      { food: 100, wood: 160, stone: 80, minerals: 400 };
    world.actors.push({ fixtureActorId: "sequence-research", actorName: faction === "Tivara" ? "AnkGuard" : "InfantryInn",
      owner: 2, position: tile(40, 14) });
    world.researchQueues = [{ producerFixtureActorId: "sequence-research",
      researchType: faction === "Tivara" ? "tivaraMacemanUpgradeLevel2" : "skaduweeWarriorUpgradeLevel2" }];
    world.receiptFault = { id: "sequence-paid-receipt", playerNumber: 2, fromTick: 1, throughTick: 800,
      commandKind: "production", maximumCommands: 1, holdHistory: true };
    if (branch === "cancel_race") world.controls.push(control("sequence-original-cancel", "sequence-research", 199,
      { kind: "cancel_research", setupQueueIndex: 0 }));
  }
  if (id === "SEQ-06") {
    const role = branch === "stair" ? "perimeter-stair" : "perimeter-wall";
    world.events = [{ id: "sequence-breach", tick: 800, kind: "destroy_owned_actor", owner: 2,
      objectName: role === "perimeter-stair" ? "Stairs" : "Wall", fixtureActorId: role }];
    if (branch === "value_lost") world.events.push({ id: "sequence-asset-loss", tick: 1200,
      kind: "destroy_owned_actor", owner: 2, objectName: "WorkMill", fixtureActorId: "protected-deposit" });
    world.actors.push({ fixtureActorId: "sequence-air", actorName: enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl",
      owner: 1, position: tile(6, 6) });
    world.controls.push(control("sequence-ground-pressure", "contact-group", 200,
      { kind: "attack", targetFixtureActorId: "original-home" }),
    control("sequence-air-pressure", "sequence-air", 4000, { kind: "attack", targetFixtureActorId: "original-home" }));
    for (const tick of [4000, 6000, 10000, 14000]) for (const [role, x, y] of
      [["worker-transit", tick % 4000 ? 32 : 28, tick % 4000 ? 23 : 31],
        ["army-transit", tick % 4000 ? 42 : 27, 25]]) world.controls.push(control(`sequence-${role}-${tick}`, role, tick,
      { kind: "move", worldPosition: tile(x, y) }));
  }
  if (id === "SEQ-07") {
    world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    world.actors.push({ fixtureActorId: "sequence-counter", actorName: enemy === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl",
      owner: 1, position: tile(6, 6) });
    world.controls.push(control("sequence-counter-show", "sequence-counter", 400,
      { kind: "move", worldPosition: tile(27, 24) }),
    control("sequence-counter-hide", "sequence-counter", branch === "stale" ? 440 : 2200,
      { kind: "move", worldPosition: tile(6, 6) }));
    world.events = Array.from({ length: 3 }, (_, i) => ({ id: `sequence-assault-loss-${i}`, tick: 1800,
      kind: "destroy_owned_actor", owner: 2, objectName: melee(faction), fixtureActorId: `army-${i}` }));
    for (let i = 0; i < 12; i++) world.controls.push(control(`sequence-force-withdraw-${i}`, `reinforcement-${i}`, 4000,
      { kind: "move", worldPosition: tile(4 + i % 4, 8 + Math.floor(i / 4)) }));
    if (branch === "alternate") {
      world.actors.push({ fixtureActorId: "sequence-opportunity-wall", actorName: "Wall", owner: 1, position: tile(23, 34) });
      for (let x = 17; x <= 23; x++) for (let y = 31; y <= 37; y++)
        if ((x === 17 || x === 23 || y === 31 || y === 37) && !(x === 23 && y === 34))
          world.terrainPatches.push({ x, y, terrain: "grass", blocked: true });
      world.events.push({ id: "sequence-opportunity-opens", tick: 4000, kind: "destroy_owned_actor", owner: 1,
        objectName: "Wall", fixtureActorId: "sequence-opportunity-wall" });
    }
  }
  return world;
}

/** Extend the proven physical partial-pack setup, preserving its original source, worker, drain and native-loss timing. */
function economySequence(faction, branch) {
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/resource-recovery-runtime.json", import.meta.url), "utf8"));
  const world = structuredClone(fixture.recipe.variants[0].presetWorld);
  if (faction === "Skaduwee") for (const actor of world.actors) {
    if (actor.actorName === "TivaraWorkerMale") actor.actorName = "SkaduweeWorkerMale";
    if (actor.actorName === "Olival") actor.actorName = "Emberstone";
  }
  world.controls = [];
  if (branch === "efficient" || branch === "congested") {
    world.actors.push({ fixtureActorId: "surviving-drain", actorName: "WorkMill", owner: 2, position: { x: 1088, y: 768, z: 0 } });
    if (branch === "congested") for (const role of ["ai-worker-3", "ai-worker-4", "ai-worker-5", "ai-worker-6"])
      world.initialOrders.push({ workerFixtureActorId: role, sourceFixtureActorId: "spare-tree", kind: "gather" });
  }
  return world;
}
