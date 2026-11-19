import { readFileSync } from "node:fs";
import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";
import { producer } from "./native-world-geometry.ts";

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
  return {
    ...structuredClone(baseline),
    fixtureId: "producer-replacement",
    requireFactionRoster: true,
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
