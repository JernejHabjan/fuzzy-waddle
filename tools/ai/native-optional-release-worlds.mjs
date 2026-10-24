import { nativeAuthorityWorld } from "./native-authority-worlds.mjs";
import { tile, melee } from "./native-scenario-worlds.mjs";

/** Native purpose loss and original paid/unknown work; saved undispatched leases belong to the approved pure control. */
export function nativeOptionalReleaseWorld(faction, branch) {
  const world = nativeAuthorityWorld("H-06", faction, "applied");
  delete world.receiptFault;
  world.actors.push({ fixtureActorId: "release-alternative", actorName: "WorkMill", owner: 1, position: tile(22, 34) });
  world.events.push({ id: "loss-optional-purpose", tick: 400, kind: "destroy_owned_actor", owner: 1,
    objectName: "WorkMill", fixtureActorId: "authority-target" });
  if (branch !== "cancelled") world.receiptFault = { id: "original-ai-receipt", playerNumber: 2,
    fromTick: 1, throughTick: 800, maximumCommands: 1, commandKind: "production",
    ...(branch === "uncertain" ? { holdHistory: true } : {}) };
  if (branch === "paid") world.queues = [{ producerFixtureActorId: "ready-producer", actorName: melee(faction), count: 2 }];
  return world;
}
