import { nativeSaveWorld } from "./native-save-worlds.mjs";

/** Autonomous saved continuation has open access; chronic-enclosure recovery belongs to H-31, not match finish. */
export function nativeLifecycleSequenceWorld(faction, branch) {
  const world = nativeSaveWorld(faction, branch === "host_transfer" ? "before_apply" : branch);
  world.actors = world.actors.filter((actor) => actor.fixtureActorId !== "recovery-door");
  world.terrainPatches = world.terrainPatches.filter((patch) =>
    !(patch.x >= 24 && patch.x <= 28 && patch.y >= 19 && patch.y <= 23 && patch.blocked));
  return world;
}
