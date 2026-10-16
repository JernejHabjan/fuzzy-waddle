import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import { unknownAiValue } from "./ai-test-fixtures";
import { catalog, demand, world, proposal } from "./ai-economy-forecast-test-fixtures";
import { aiResourceForecastDeficit, projectAiResourceForecasts } from "../planning/ai-resource-forecast";
import { canAffordAiEconomyCost } from "../planning/ai-economy-policy";

describe("typed deterministic economy forecast scenarios", () => {
  it("H-16: replaces an optimistic income estimate with delivered income without making it spendable", () => {
    const base = world(0, 1000);
    const observed = (income: number) => ({
      ...base,
      resources: base.resources.map((entry) =>
        entry.resourceType === ResourceType.Wood
          ? { ...entry, deliveredIncomePerMinute: { status: "known" as const, observedTick: 20, value: income } }
          : entry
      )
    });
    const optimistic = observed(2000);
    const stalled = observed(0);
    const forecast = projectAiResourceForecasts(stalled, [demand], catalog).find(
      (entry) => entry.resourceType === ResourceType.Wood
    );
    if (!forecast) throw new Error("wood_forecast_missing");
    expect(aiResourceForecastDeficit(optimistic, forecast)).toBeLessThanOrEqual(0);
    expect(aiResourceForecastDeficit(stalled, forecast)).toBeGreaterThan(0);
    expect(canAffordAiEconomyCost(optimistic, { [ResourceType.Wood]: 1 })).toBe(false);
    expect(canAffordAiEconomyCost(stalled, { [ResourceType.Wood]: 1 })).toBe(false);
    const restored = proposal(0, 1000, [demand], stalled);
    expect(restored.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        resourceType: ResourceType.Wood,
        sourceActorId: "wood-source"
      })
    );
  });
  it("ECO-05: leaves returning and loaded workers alone and retains the final food gatherer", () => {
    const baseline = world(0, 1000);
    const workers = baseline.actors.map((actor) => {
      if (actor.actorId === "worker-0")
        return {
          ...actor,
          activeOrder: {
            status: "known" as const,
            observedTick: 20,
            value: { orderType: OrderType.ReturnResources, targetActorId: "producer" }
          }
        };
      if (actor.actorId === "worker-1")
        return {
          ...actor,
          resourceState: {
            status: "known" as const,
            observedTick: 20,
            value: {
              resourceType: ResourceType.Food,
              available: unknownAiValue,
              carried: { status: "known" as const, observedTick: 20, value: 10 },
              growthReadyTick: unknownAiValue,
              serviceCapacity: unknownAiValue
            }
          }
        };
      return actor;
    });
    const result = proposal(0, 1000, [demand], { ...baseline, actors: workers });
    expect(result.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        actorIds: ["worker-2"],
        sourceActorId: "wood-source"
      })
    );
    const oneFoodWorker = proposal(0, 1000, [demand], {
      ...baseline,
      actors: baseline.actors.filter((actor) => !actor.actorId.startsWith("worker-") || actor.actorId === "worker-1")
    });
    expect(
      oneFoodWorker.intents.some(
        (intent) => intent.kind === "assign_gatherers" && intent.reasonCode.startsWith("economy:surplus_transfer")
      )
    ).toBe(false);
  });

  it("ECO-05: skips an idle worker unable to gather the shortage resource", () => {
    const baseline = world(0, 1000);
    const limitedCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        ...catalog.entries
          .filter((entry) => entry.sourceObjectName === ObjectNames.TivaraWorker)
          .map((entry) => ({
            ...entry,
            sourceObjectName: ObjectNames.TivaraWorkerFemale,
            gathers: [ResourceType.Food]
          })),
        ...catalog.entries
      ]
    };
    const actors = baseline.actors.map((actor) =>
      actor.actorId === "worker-0" ? { ...actor, objectName: ObjectNames.TivaraWorkerFemale } : actor
    );
    const result = proposal(0, 1000, [demand], { ...baseline, actors }, limitedCatalog);
    expect(result.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        actorIds: ["worker-1"],
        resourceType: ResourceType.Wood,
        sourceActorId: "wood-source"
      })
    );
    expect(
      result.intents.some(
        (intent) =>
          intent.kind === "assign_gatherers" &&
          intent.actorIds.includes("worker-0") &&
          intent.resourceType === ResourceType.Wood
      )
    ).toBe(false);
  });
  it("H-16: moves a confirmed empty worker beyond source capacity without inventing donor surplus", () => {
    const base = world(0, 0);
    const actors = base.actors.map((actor) =>
      actor.actorId.startsWith("worker-")
        ? {
            ...actor,
            carriedResourceAmount: 0,
            resourceTransferInFlight: false,
            activeOrder: {
              status: "known" as const,
              observedTick: 20,
              value: { orderType: OrderType.Gather, targetActorId: "food-source" }
            }
          }
        : actor.actorId === "food-source" && actor.resourceState.status === "known"
          ? {
              ...actor,
              resourceState: {
                ...actor.resourceState,
                value: {
                  ...actor.resourceState.value,
                  serviceCapacity: { status: "known" as const, observedTick: 20, value: 2 }
                }
              }
            }
          : actor
    );
    const result = proposal(0, 0, [demand], { ...base, actors });
    expect(result.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        resourceType: ResourceType.Wood,
        sourceActorId: "wood-source",
        actorIds: ["worker-0"]
      })
    );
    const busy = proposal(0, 0, [demand], {
      ...base,
      actors: actors.map((actor) =>
        actor.actorId.startsWith("worker-") ? { ...actor, resourceTransferInFlight: true } : actor
      )
    });
    expect(busy.intents.some((intent) => intent.kind === "assign_gatherers")).toBe(false);
  });
});
