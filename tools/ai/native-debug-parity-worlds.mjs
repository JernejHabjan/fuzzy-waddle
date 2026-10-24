import { nativeTopologyChurnWorld } from "./native-topology-churn-worlds.mjs";

/** Every debug mode receives exactly the same native world, including an unresolved original paid command at quota pressure. */
export function nativeDebugParityWorld(faction) {
  const world = nativeTopologyChurnWorld(faction, "dispose");
  world.receiptFault = { id: "debug-original-pending", playerNumber: 2, fromTick: 1000, throughTick: 4000,
    maximumCommands: 1, commandKind: "production", holdHistory: true };
  return world;
}
