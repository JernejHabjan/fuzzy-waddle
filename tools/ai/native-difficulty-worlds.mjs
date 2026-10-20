import { nativeScenarioWorld } from "./native-scenario-worlds.mjs";

/** Same legal economy/roster for every policy; no early forced fight or fixture-supplied income masks scheduling. */
export function nativeDifficultyWorld(faction, branch) {
  const world = nativeScenarioWorld("D-01", faction, branch);
  const excluded = new Set(["contact-group", "front-target-a", "front-target-b", "noise-scout",
    "ranged-probe", "support-probe"]);
  world.actors = world.actors.filter((actor) => !actor.fixtureActorId.startsWith("army-") &&
    !excluded.has(actor.fixtureActorId));
  world.initialOrders.push({ workerFixtureActorId: "worker-0", sourceFixtureActorId: "own-source", kind: "gather" });
  return world;
}
