import { nativeRecoveryWorld } from "./native-recovery-worlds.mjs";
import { tile, melee } from "./native-scenario-worlds.mjs";

/** Autonomous SP continuation: all external setup precedes the save; no future scripted input is silently omitted. */
export function nativeSaveWorld(faction, branch) {
  const world = nativeRecoveryWorld("H-01", faction, "bounded");
  world.events = [];
  world.controls = [];
  world.routeOutages = [];
  if (branch !== "during_active")
    world.resourceStarts.find((entry) => entry.playerNumber === 2).amounts = {
      food: 6000,
      wood: 6000,
      stone: 3000,
      minerals: 3000
    };
  if (branch === "applied_pending")
    world.receiptFault = {
      id: "save-original-receipt",
      playerNumber: 2,
      fromTick: 1,
      throughTick: 199,
      maximumCommands: 1,
      commandKind: "production",
      holdHistory: true
    };
  if (branch === "during_active") {
    // Queue/construction setup spends through real command authority. Grant cash before those commands;
    // a post-charge resourceStart would silently refund the very work this save branch claims to preserve.
    world.resourceStarts = world.resourceStarts.filter((entry) => entry.playerNumber !== 2);
    world.resourceGrants.push({ playerNumber: 2, amounts: { food: 6000, wood: 6000, stone: 3000, minerals: 3000 } });
    world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 4 }];
    world.actors.push({
      fixtureActorId: "save-research",
      actorName: faction === "Tivara" ? "AnkGuard" : "InfantryInn",
      owner: 2,
      position: tile(40, 14)
    });
    world.researchQueues = [
      {
        producerFixtureActorId: "save-research",
        researchType: faction === "Tivara" ? "tivaraMacemanUpgradeLevel2" : "skaduweeWarriorUpgradeLevel2"
      }
    ];
    world.constructionOrders = [
      {
        fixtureActorId: "save-paid-site",
        actorName: faction === "Tivara" ? "Olival" : "Emberstone",
        builderFixtureActorIds: ["worker-0"],
        position: tile(5, 40)
      }
    ];
    // Stage the assigned builder at the legal site's approach so native construction can begin and charge
    // before the tick-119 save boundary, rather than merely preserving an unstarted placement.
    world.actors.find((actor) => actor.fixtureActorId === "worker-0").position = tile(3, 40);
  }
  return world;
}
