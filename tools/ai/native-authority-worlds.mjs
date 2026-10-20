import { nativeScenarioWorld, tile, melee, producer } from "./native-scenario-worlds.mjs";
import { control } from "./native-domain-worlds.mjs";

/** Actual scarce/stress budgets, native duties and consumer-only receipt faults; no brain/claim/payment state injection. */
export function nativeAuthorityWorld(id, faction, branch) {
  const world = nativeScenarioWorld(id, faction, branch), enemy = faction === "Tivara" ? "Skaduwee" : "Tivara";
  const actor = (role, name, owner, x, y) => ({ fixtureActorId: role, actorName: name, owner, position: tile(x, y) });
  world.actors = world.actors.filter((a) =>
    !["contact-group", "noise-scout", "front-target-a", "front-target-b"].includes(a.fixtureActorId));
  world.actors.push(actor("authority-target", "WorkMill", 1, 19, 27));
  world.initialOrders.push({ workerFixtureActorId: "worker-1", sourceFixtureActorId: "own-source", kind: "gather" });
  for (let i = 0; i < 4; i++) world.actors.push(actor(`authority-house-${i}`,
    faction === "Tivara" ? "Olival" : "Emberstone", 2, 43, 28 + i * 4));
  if (["H-06", "H-07", "H-10", "H-15"].includes(id)) {
    world.receiptFault = { id: "original-ai-receipt", playerNumber: 2, fromTick: 1,
      throughTick: id === "H-10" ? branch === "resumed" ? 1200 : 1800 : branch === "late" ? 1000 : 800,
      maximumCommands: id === "H-10" ? branch === "below_capacity" ? 127 : 128 : 1,
      commandKind: id === "H-10" ? "any" : "production",
      ...(["H-10", "H-15"].includes(id) ? { holdHistory: true } : {}),
      ...(id === "H-06" && branch === "rejected" ? { contendQueue: true } : {}),
      ...(id === "H-07" && branch === "destroyed" ? { destroyOutput: true } : {}) };
  }
  if (id === "H-10") {
    world.resourceStarts.find((start) => start.playerNumber === 2).amounts =
      { food: 50000, wood: 50000, stone: 10000, minerals: 10000 };
    for (let i = 0; i < 6; i++) world.actors.push(actor(`stress-producer-${i}`, producer(faction), 2,
      35 + i % 2 * 5, 5 + Math.floor(i / 2) * 6));
    for (let i = 0; i < 32; i++) world.actors.push(actor(`pressure-${i}`, melee(enemy), 1,
      17 + i % 4, 15 + Math.floor(i / 4)));
  }
  if (id === "H-13") {
    for (const [i, x, y] of [[0, 40, 9], [1, 40, 40], [2, 12, 40]])
      world.actors.push(actor(`budget-base-${i}`, faction === "Tivara" ? "Sandhold" : "FrostForge", 2, x, y));
    world.resourceStarts.find((start) => start.playerNumber === 2).amounts =
      { food: 120, wood: branch === "executable" ? 350 : 150,
        stone: branch === "executable" ? 350 : 120, minerals: branch === "executable" ? 350 : 40 };
    if (branch === "new_identity") {
      world.resourceStarts.find((start) => start.playerNumber === 2).amounts =
        { food: 120, wood: 1800, stone: 1800, minerals: 40 };
      world.controls.push(control("ordinary-new-base", "worker-7", 200,
        { kind: "construct", actorName: faction === "Tivara" ? "Sandhold" : "FrostForge", worldPosition: tile(45, 14) }));
    }
    if (branch === "essential") world.resourceStarts.find((start) => start.playerNumber === 2).amounts.food = 0;
    if (branch === "essential") world.events.push({ id: "loss-essential-house", tick: 200,
      kind: "destroy_owned_actor", owner: 2, objectName: faction === "Tivara" ? "Olival" : "Emberstone",
      fixtureActorId: "ready-house" });
  }
  if (id === "H-14") {
    world.actors.push(actor("harmless-scout", `${enemy}WorkerMale`, 1, 15, 10));
    world.actors.find((a) => a.fixtureActorId === "scout-probe").position = tile(28, 10);
    for (const tick of [200, 600, 1000]) {
      world.controls.push(control(`noise-show-${tick}`, "harmless-scout", tick,
        { kind: "move", worldPosition: tile(22, 10) }), control(`noise-leave-${tick}`, "harmless-scout", tick + 200,
        { kind: "move", worldPosition: tile(15, 10) }));
    }
    for (let y = 0; y < 19; y++) world.terrainPatches.push({ x: 25, y, terrain: "water", blocked: false });
    if (branch === "scarcity") world.resourceStarts.find((start) => start.playerNumber === 2).amounts =
      { food: 0, wood: 0, stone: 0, minerals: 0 };
    if (branch === "supply_noise") world.events.push({ id: "loss-noisy-house", tick: 600,
      kind: "destroy_owned_actor", owner: 2, objectName: faction === "Tivara" ? "Olival" : "Emberstone",
      fixtureActorId: "ready-house" });
  }
  if (id === "H-15") {
    for (let i = 0; i < 16; i++) {
      const role = `lethal-attacker-${i}`;
      world.actors.push(actor(role, melee(enemy), 1, branch === "far" ? 5 + i % 4 : 28 + i % 4,
        branch === "far" ? 5 + Math.floor(i / 4) : 10 + Math.floor(i / 4)));
      if (branch !== "far") world.controls.push(control(`lethal-attack-${i}`, role, 200,
        { kind: "attack", targetFixtureActorId: "original-home" }));
      if (branch === "resolved") world.controls.push(control(`lethal-withdraw-${i}`, role, 1000,
        { kind: "move", worldPosition: tile(5 + i % 4, 5 + Math.floor(i / 4)) }));
    }
    if (branch === "far") world.actors.push(actor("distant-threat-observer", melee(faction), 2, 12, 8));
  }
  return world;
}
