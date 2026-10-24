import { readFileSync } from "node:fs";
import { nativeAuthorityWorld } from "./native-authority-worlds.mjs";
import { tile } from "./native-scenario-worlds.mjs";

/** Actual land enclosed by water, observed resources and an owned native carrier; the AI authors every transport/build order. */
export function nativeIslandEstablishmentWorld(faction, branch) {
  const world = nativeAuthorityWorld("H-06", faction, "applied");
  delete world.receiptFault;
  world.actors = world.actors.filter((actor) => actor.owner !== 1 && actor.fixtureActorId !== "scout-probe");
  const roles = new Set(world.actors.map((actor) => actor.fixtureActorId));
  world.initialOrders = world.initialOrders.filter((order) => roles.has(order.workerFixtureActorId));
  world.actors.push({ fixtureActorId: "island-vision", actorName: faction === "Tivara" ? "TivaraAlchemist" : "SkaduweeOwl",
    owner: 2, position: tile(21, 26) }, { fixtureActorId: "island-source", actorName: "Tree1", owner: null,
    position: tile(19, 29) }, { fixtureActorId: "island-carrier", actorName: "CommonBoat", owner: 2, position: tile(25, 26) });
  for (let x = 13; x <= 26; x++) for (let y = 17; y <= 38; y++) {
    const island = x >= 17 && x <= 22 && y >= 22 && y <= 33;
    world.terrainPatches.push({ x, y, terrain: island ? "grass" : "water", blocked: false });
  }
  const inherited = JSON.parse(readFileSync(new URL("./fixtures/expansion-pressure-runtime.json", import.meta.url), "utf8"))
    .recipe.variants[0].presetWorld.existingActorBindings.filter((actor) => actor.owner === null);
  world.existingActorBindings.push(...structuredClone(inherited));
  world.sourceStocks = inherited.map((actor) => ({ fixtureActorId: actor.fixtureActorId, amount: 0 }));
  world.sourceStocks.push({ fixtureActorId: "own-source", amount: 100 }, { fixtureActorId: "island-source", amount: 2000 });
  world.resourceStarts.find((entry) => entry.playerNumber === 2).amounts =
    { food: 1200, wood: 300, stone: 800, minerals: 800 };
  world.routeOutages = [{ id: "island-original-passenger-delay", fromTick: 1, throughTick: 1001,
    fixtureActorIds: Array.from({ length: 8 }, (_, i) => `worker-${i}`), mode: "pending",
    membership: branch === "builder_late" ? "indispensable_builder" : "optional_passenger" }];
  if (branch === "optional_lost") world.events.push({ id: "island-original-optional-loss", tick: 400,
    kind: "destroy_owned_actor", owner: 2, objectName: `${faction}WorkerMale`, membership: "optional_passenger" });
  return world;
}
