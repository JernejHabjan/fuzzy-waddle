import { readFileSync } from "node:fs";
import type { NativeScenarioWorld } from "../../contracts/scenarios/native-scenario-world.ts";
import { actor, producer, tile } from "./native-world-geometry.ts";

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
  const positions: Record<string, ReturnType<typeof tile>> = {
    "producer-1": tile(35, 27),
    "producer-2": tile(40, 24),
    housing: tile(39, 18),
    granary: tile(38, 31),
    field: tile(34, 34),
    "worker-1": tile(36, 33),
    "worker-2": tile(37, 33),
    "worker-3": tile(36, 23),
    "worker-4": tile(37, 23),
    "worker-5": tile(36, 24),
    "worker-6": tile(37, 24)
  };
  world.actors = world.actors.map((entry) => ({
    ...entry,
    position: positions[entry.fixtureActorId] ?? entry.position
  }));
  world.actors.push(
    actor("field-2", "Field", 2, 38, 35),
    actor("field-3", "Field", 2, 42, 35),
    actor("field-4", "Field", 2, 42, 30)
  );
  return {
    ...world,
    fixtureId: "producer-replacement",
    requireFactionRoster: true,
    // Start with enough for one replacement. An opening recruitment grant fills the standing force before the loss.
    resourceGrants: [],
    resourceStarts: [{ playerNumber: 2, amounts: { food: 0, wood: 200, stone: 50, minerals: 0 } }],
    initialOrders: [{ workerFixtureActorId: "worker-1", sourceFixtureActorId: "field", kind: "gather" }],
    events:
      branch === "loss"
        ? [
            {
              id: "producer-loss",
              tick: 40,
              kind: "destroy_owned_actor",
              owner: 2,
              objectName: producer(faction),
              fixtureActorId: "producer-1"
            }
          ]
        : []
  };
}
