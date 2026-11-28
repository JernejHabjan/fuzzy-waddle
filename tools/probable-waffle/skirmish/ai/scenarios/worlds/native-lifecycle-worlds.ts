import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";
import { nativeTopologyChurnWorld } from "./native-topology-churn-worlds.ts";
import { nativeOptionalReleaseWorld } from "./native-optional-release-worlds.ts";
import { nativeDifficultyWorld } from "./native-difficulty-worlds.ts";

/** SP branches retain native work; host replacement uses an ordinary relayed first match and this setup only next. */
export function nativeLifecycleWorld(faction, branch): NativeScenarioWorld {
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
