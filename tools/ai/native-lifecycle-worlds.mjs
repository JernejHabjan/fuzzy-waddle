import { nativeTopologyChurnWorld } from "./native-topology-churn-worlds.mjs";
import { nativeOptionalReleaseWorld } from "./native-optional-release-worlds.mjs";
import { nativeDifficultyWorld } from "./native-difficulty-worlds.mjs";

/** SP branches retain native work; host replacement uses an ordinary relayed first match and this setup only next. */
export function nativeLifecycleWorld(faction, branch) {
  if (branch === "pending_path") {
    const world = nativeTopologyChurnWorld(faction, "dispose");
    // The first match can terminate at tick 20; retain its query while the original early outage is active.
    world.routeOutages = world.routeOutages.filter((outage) => outage.id === "churn-stable-query");
    world.events = [];
    return world;
  }
  if (branch === "paid_queue") {
    const world = nativeOptionalReleaseWorld(faction, "paid");
    delete world.receiptFault;
    world.events = [];
    return world;
  }
  return nativeDifficultyWorld(faction, "normal");
}
