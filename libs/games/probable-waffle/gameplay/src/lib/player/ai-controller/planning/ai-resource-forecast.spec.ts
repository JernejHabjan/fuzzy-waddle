import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { createAiTestObservation } from "../testing/ai-test-fixtures";
import { canAffordAiEconomyCost } from "./ai-economy-policy";
import { projectAiResourceForecasts, selectAiForecastResource } from "./ai-resource-forecast";

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
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
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Food]: 100 },
        footprintRadiusTiles: 0,
        visionRange: 8,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    }
  ]
};

function demand(): AiDemandV1 {
  return {
    demandId: "demand:test:army",
    purpose: "pressure",
    capabilityOrRole: "ground_combat",
    unit: "actor_count",
    desired: 5,
    satisfiedActorIds: ["unit-1"],
    queuedIds: ["unit-2"],
    constructingIds: [],
    acceptedNotObservedEffectIds: [],
    preferredObjectNames: [ObjectNames.TivaraMacemanMale],
    resourceObligations: {}
  };
}

describe("AI resource forecast", () => {
  it("prices the unmet portion of a production demand from the runtime catalog", () => {
    const forecasts = projectAiResourceForecasts(createAiTestObservation(), [demand()], catalog);

    expect(forecasts.find((forecast) => forecast.resourceType === ResourceType.Food)).toMatchObject({
      amount: 300,
      confidencePermille: 800
    });
  });

  it("prioritizes the largest forecast deficit instead of the smallest raw stockpile", () => {
    const observation = {
      ...createAiTestObservation(),
      resources: [
        ...createAiTestObservation().resources,
        {
          resourceType: ResourceType.Food,
          stockpile: 200,
          reservedUnspent: 0,
          obligationsDue: 0,
          deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const forecasts = projectAiResourceForecasts(observation, [demand()], catalog);

    expect(selectAiForecastResource(observation, forecasts, new Set([ResourceType.Wood, ResourceType.Food]))).toBe(
      ResourceType.Food
    );
  });

  it("sums distinct dated consumers while keeping reserved and due food unavailable for new promises", () => {
    const observation = {
      ...createAiTestObservation(),
      resources: [
        {
          resourceType: ResourceType.Food,
          stockpile: 500,
          reservedUnspent: 150,
          obligationsDue: 100,
          deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const army = demand();
    const supply: AiDemandV1 = {
      ...demand(),
      demandId: "demand:test:supply",
      purpose: "supply",
      desired: 2,
      satisfiedActorIds: [],
      queuedIds: [],
      preferredObjectNames: [ObjectNames.TivaraMacemanMale]
    };
    const forecasts = projectAiResourceForecasts(observation, [army, supply], catalog);

    expect(forecasts.find((forecast) => forecast.resourceType === ResourceType.Food)?.amount).toBe(500);
    expect(canAffordAiEconomyCost(observation, { [ResourceType.Food]: 250 })).toBe(true);
    expect(canAffordAiEconomyCost(observation, { [ResourceType.Food]: 251 })).toBe(false);
  });
});
