import { readFileSync } from "node:fs";
import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";
import { producer, tile } from "./native-world-geometry.ts";

const capacity = JSON.parse(
  readFileSync(
    new URL("../../testing/fixtures/native/production/production-capacity-native-gameplay.json", import.meta.url),
    "utf8"
  )
);

/** Start with the same pair of ready producers as the native no-growth control. */
export function nativeProductionReplacementWorld(faction: string, branch: string): NativeScenarioWorld {
  const baseline = capacity.recipe.variants.find(
    (variant) => variant.aiFaction === faction && variant.productionCapacityBranch === "already_sufficient"
  ).presetWorld;
  const world: NativeScenarioWorld = structuredClone(baseline);
  // Use legal tile centers on the frozen open map for both the lost producer and its control.
  world.actors = world.actors.map((actor) => {
    if (actor.fixtureActorId === "producer-1") return { ...actor, position: tile(35, 27) };
    if (actor.fixtureActorId === "producer-2") return { ...actor, position: tile(40, 24) };
    return actor;
  });
  return {
    ...world,
    fixtureId: "producer-replacement",
    requireFactionRoster: true,
    resourceStarts: [],
    events:
      branch === "loss"
        ? [
            {
              id: "producer-loss",
              tick: 200,
              kind: "destroy_owned_actor",
              owner: 2,
              objectName: producer(faction),
              fixtureActorId: "producer-1"
            }
          ]
        : []
  };
}
