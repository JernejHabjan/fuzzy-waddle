import { nativeAuthorityWorld } from "./native-authority-worlds.mjs";
import { tile } from "./native-scenario-worlds.mjs";

/** Finite native topology changes keep original route ownership and independent productive duties alive. */
export function nativeTopologyChurnWorld(faction, branch) {
  const world = nativeAuthorityWorld("H-06", faction, "applied");
  delete world.receiptFault;
  world.routeOutages = [{ id: "churn-stable-query", fromTick: 1, throughTick: 1001,
    fixtureActorIds: ["army-0"], mode: "pending" }];
  for (let i = 0; i < 6; i++) {
    const role = `churn-wall-${i}`;
    world.actors.push({ fixtureActorId: role, actorName: "Wall", owner: 1,
      position: tile(branch === "unrelated" ? 8 + i : 24, branch === "unrelated" ? 38 : 22 + i) });
    world.events.push({ id: `loss-${role}`, tick: 200 + i * 160, kind: "destroy_owned_actor", owner: 1,
      objectName: "Wall", fixtureActorId: role });
  }
  if (branch !== "unrelated") for (let y = 0; y < 50; y++) {
    if (y >= 22 && y <= 27) continue;
    world.terrainPatches.push({ x: 24, y, terrain: "water", blocked: false });
  }
  if (branch === "dispose") world.routeOutages.push({ id: "churn-disposal-query", fromTick: 3500,
    throughTick: 4500, fixtureActorIds: ["army-0"], mode: "pending" });
  return world;
}
