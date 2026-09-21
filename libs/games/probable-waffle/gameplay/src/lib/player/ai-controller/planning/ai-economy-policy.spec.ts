import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { canAffordAiEconomyCost, decideAiEconomyPolicy } from "./ai-economy-policy";

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "worker",
      family: "worker",
      sourceObjectName: ObjectNames.TivaraWorker,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [ResourceType.Food, ResourceType.Wood],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Food]: 50 },
        footprintRadiusTiles: 0,
        visionRange: 4,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    }
  ]
};

function foodSource(actorId: string, capacity: number) {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.Field,
    relation: "neutral" as const,
    visibility: "visible" as const,
    resourceState: {
      status: "known" as const,
      value: {
        resourceType: ResourceType.Food,
        available: { status: "known" as const, value: 100, observedTick: 20 },
        serviceCapacity: { status: "known" as const, value: capacity, observedTick: 20 }
      },
      observedTick: 20
    }
  };
}

describe("decideAiEconomyPolicy", () => {
  it("uses only unreserved stockpile when admitting economy construction", () => {
    const observation = {
      ...createAiTestObservation(),
      resources: [{ ...createAiTestObservation().resources[0], stockpile: 100, reservedUnspent: 50, obligationsDue: 20 }]
    };

    expect(canAffordAiEconomyCost(observation, { [ResourceType.Wood]: 30 })).toBe(true);
    expect(canAffordAiEconomyCost(observation, { [ResourceType.Wood]: 31 })).toBe(false);
  });

  it("grows beyond the six-worker recovery floor when dated demand and capacity exist", () => {
    const workers = Array.from({ length: 6 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const observation = {
      ...createAiTestObservation(),
      actors: [...workers, foodSource("food", 4)],
      resources: [{ ...createAiTestObservation().resources[0], stockpile: 0 }]
    };

    const policy = decideAiEconomyPolicy(observation, catalog, [
      { resourceType: ResourceType.Wood, amount: 600 }
    ]);

    expect(policy.desiredWorkers).toBe(8);
    expect(policy.desiredFoodSources).toBe(6);
  });

  it("freezes optional growth under visible pressure while preserving returning workers", () => {
    const workers = Array.from({ length: 8 }, (_, index) => ({
      ...createAiTestOwnedActor(`worker-${index}`),
      activeOrder: {
        status: "known" as const,
        value: index === 0 ? { orderType: OrderType.ReturnResources, targetActorId: "base" } : null,
        observedTick: 20
      }
    }));
    const observation = {
      ...createAiTestObservation(),
      actors: [...workers, foodSource("food", 18)],
      threatSummary: { ...createAiTestObservation().threatSummary, visibleEnemyActorIds: ["enemy"] }
    };

    const policy = decideAiEconomyPolicy(observation, catalog, [
      { resourceType: ResourceType.Wood, amount: 1200 }
    ]);

    expect(policy).toMatchObject({ desiredWorkers: 8, assignedWorkers: 1, posture: "emergency" });
    expect(policy.budget).toEqual({ economyPermille: 200, defensePermille: 800 });
  });
});
