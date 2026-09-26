import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { calculateAiHousingDemand } from "./ai-housing-demand";

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "housing",
      family: "housing",
      sourceObjectName: ObjectNames.Olival,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: 8,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 80 },
        footprintRadiusTiles: 1,
        visionRange: 4,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    },
    {
      capabilityId: "unit",
      family: "frontline",
      sourceObjectName: ObjectNames.TivaraMacemanMale,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    }
  ]
};

function housing(actorId: string, constructionProgress = 100) {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.Olival,
    housingCapacity: { status: "known" as const, value: 8, observedTick: 20 },
    housingCost: { status: "known" as const, value: 0, observedTick: 20 },
    constructionProgress: { status: "known" as const, value: constructionProgress, observedTick: 20 }
  };
}

function queuedProducer(itemCount: number) {
  return {
    ...createAiTestOwnedActor("producer"),
    housingCost: { status: "known" as const, value: 0, observedTick: 20 },
    queue: {
      status: "known" as const,
      observedTick: 20,
      value: {
        capacity: 8,
        occupied: itemCount,
        itemIds: Array.from({ length: itemCount }, (_, index) => `queue-${index}`),
        items: Array.from({ length: itemCount }, (_, index) => ({
          itemId: `queue-${index}`,
          kind: "production" as const,
          objectName: ObjectNames.TivaraMacemanMale,
          researchType: null
        }))
      }
    }
  };
}

describe("housing capacity demand", () => {
  it("prebuilds a useful house for queued population even while current supply looks sufficient", () => {
    const workers = Array.from({ length: 4 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const observation = {
      ...createAiTestObservation(),
      actors: [...workers, housing("house"), queuedProducer(4)]
    };
    const demand = calculateAiHousingDemand(observation, catalog, ObjectNames.Olival, 3, []);

    expect(demand).toMatchObject({ readyCapacity: 8, used: 4, queuedPopulation: 4, neededBuildings: 1 });
    expect(demand.desiredBuildingCount).toBe(2);
    expect(calculateAiHousingDemand({ ...observation, actors: [...workers, housing("house"), queuedProducer(0)] },
      catalog, ObjectNames.Olival, 3, []).neededBuildings).toBe(0);
  });

  it("counts unfinished and accepted capacity once instead of duplicating the same house", () => {
    const workers = Array.from({ length: 4 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const base = createAiTestObservation();
    const actors = [...workers, housing("house"), queuedProducer(4)];
    const constructing = calculateAiHousingDemand(
      { ...base, actors: [...actors, { ...housing("site", 50), activeEffectIds: ["effect:supply"] }] },
      catalog, ObjectNames.Olival, 3, ["effect:supply" as never]
    );
    const accepted = calculateAiHousingDemand(
      { ...base, actors }, catalog, ObjectNames.Olival, 3, ["effect:supply" as never]
    );

    expect(constructing.neededBuildings).toBe(0);
    expect(accepted.neededBuildings).toBe(0);
    expect(constructing.acceptedEffectIds).toEqual([]);
    expect(constructing.constructing.map((actor) => actor.actorId)).toEqual(["site"]);
  });
});
