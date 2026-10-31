import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";

import type { AiDemandV1 } from "../contracts/ai-plan-contracts";

import { canAffordAiEconomyCost } from "../planning/ai-economy-policy";
import { projectAiResourceForecasts } from "../planning/ai-resource-forecast";

import { createAiTestOwnedActor } from "./ai-test-fixtures";
import { catalog, demand, source, world, proposal } from "./ai-economy-forecast-test-fixtures";

describe("typed deterministic economy forecast scenarios", () => {
  it("ECO-03: assigns the next worker to spare source capacity, not a saturated source", () => {
    const saturatedWorkers = Array.from({ length: 12 }, (_, index) => ({
      ...createAiTestOwnedActor(`busy-worker-${index}`),
      activeOrder: {
        status: "known" as const,
        observedTick: 20,
        value: { orderType: OrderType.Gather, targetActorId: "wood-source-a" }
      }
    }));
    const baseline = world(0, 500);
    const actors = [
      ...saturatedWorkers,
      {
        ...createAiTestOwnedActor("idle-worker"),
        activeOrder: { status: "known" as const, observedTick: 20, value: null }
      },
      ...baseline.actors.filter((actor) => actor.actorId === "producer"),
      source("wood-source-a", ObjectNames.Tree1, ResourceType.Wood, 12),
      source("wood-source-b", ObjectNames.Tree1, ResourceType.Wood, 2),
      source("food-source", ObjectNames.CropsWheat, ResourceType.Food, 6)
    ];
    const runs = Array.from({ length: 3 }, () => proposal(0, 500, [demand], { ...baseline, actors }));
    const noSpareCapacity = proposal(0, 500, [demand], {
      ...baseline,
      actors: actors.filter((actor) => actor.actorId !== "wood-source-b")
    });

    expect(new Set(runs.map(digestCanonicalAiValue)).size).toBe(1);
    expect(runs[0]?.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        actorIds: ["idle-worker"],
        resourceType: ResourceType.Wood,
        sourceActorId: "wood-source-b"
      })
    );
    expect(
      runs[0]?.intents.some((intent) => intent.kind === "assign_gatherers" && intent.sourceActorId === "wood-source-a")
    ).toBe(false);
    expect(
      noSpareCapacity.intents.some(
        (intent) => intent.kind === "assign_gatherers" && intent.resourceType === ResourceType.Wood
      )
    ).toBe(false);
  });

  it("ECO-04: shifts idle labor to the priced wood shortfall before ranged production stalls", () => {
    const runs = Array.from({ length: 3 }, () => proposal(0, 500));
    const control = proposal(1000, 0);

    expect(new Set(runs.map((result) => digestCanonicalAiValue(result))).size).toBe(1);
    expect(runs[0]?.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        resourceType: ResourceType.Wood,
        sourceActorId: "wood-source",
        actorIds: ["worker-0"]
      })
    );
    expect(control.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        resourceType: ResourceType.Food,
        sourceActorId: "food-source"
      })
    );
  });

  it("ECO-05: aggregates queued force, upgrade, expansion and supply needs without promising reserved wood", () => {
    const consumers: readonly AiDemandV1[] = [
      { ...demand, queuedIds: ["ranged-queued-1", "ranged-queued-2"] },
      {
        ...demand,
        demandId: "demand:forecast:upgrade",
        purpose: "upgrade",
        desired: 1,
        queuedIds: [],
        preferredObjectNames: [],
        resourceObligations: { [ResourceType.Wood]: 80 }
      },
      {
        ...demand,
        demandId: "demand:forecast:expansion",
        purpose: "expansion",
        desired: 1,
        queuedIds: [],
        preferredObjectNames: [],
        resourceObligations: { [ResourceType.Wood]: 100 }
      },
      {
        ...demand,
        demandId: "demand:forecast:supply",
        purpose: "supply",
        desired: 1,
        queuedIds: [],
        preferredObjectNames: [],
        resourceObligations: { [ResourceType.Wood]: 50 }
      }
    ];
    const scarceWorld = world(200, 500);
    const scarceWood = scarceWorld.resources.map((entry) =>
      entry.resourceType === ResourceType.Wood ? { ...entry, reservedUnspent: 30, obligationsDue: 40 } : entry
    );
    const obligated = { ...scarceWorld, resources: scarceWood };
    const forecasts = projectAiResourceForecasts(obligated, consumers, catalog);
    const shortageRuns = Array.from({ length: 3 }, () => proposal(0, 500, consumers));
    const surplusRuns = Array.from({ length: 3 }, () => proposal(1000, 0, consumers));

    expect(forecasts.find((entry) => entry.resourceType === ResourceType.Wood)?.amount).toBe(530);
    expect(canAffordAiEconomyCost(obligated, { [ResourceType.Wood]: 130 })).toBe(true);
    expect(canAffordAiEconomyCost(obligated, { [ResourceType.Wood]: 131 })).toBe(false);
    expect(new Set(shortageRuns.map(digestCanonicalAiValue)).size).toBe(1);
    expect(new Set(surplusRuns.map(digestCanonicalAiValue)).size).toBe(1);
    expect(shortageRuns[0]?.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        resourceType: ResourceType.Wood,
        sourceActorId: "wood-source"
      })
    );
    expect(surplusRuns[0]?.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        resourceType: ResourceType.Food,
        sourceActorId: "food-source"
      })
    );
  });

  it("ECO-05: transfers one unloaded gatherer from food surplus to a priced wood deficit", () => {
    const baseline = world(0, 1000);
    const allBusy = {
      ...baseline,
      actors: baseline.actors.map((actor) =>
        actor.actorId === "worker-0"
          ? {
              ...actor,
              activeOrder: {
                status: "known" as const,
                observedTick: 20,
                value: { orderType: OrderType.Gather, targetActorId: "food-source" }
              }
            }
          : actor
      )
    };
    const runs = Array.from({ length: 3 }, () => proposal(0, 1000, [demand], allBusy));
    expect(new Set(runs.map(digestCanonicalAiValue)).size).toBe(1);
    expect(runs[0]?.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        actorIds: ["worker-0"],
        resourceType: ResourceType.Wood,
        sourceActorId: "wood-source",
        reasonCode: "economy:surplus_transfer:1:wood"
      })
    );
    const foodScarce = proposal(0, 50, [demand], {
      ...allBusy,
      resources: allBusy.resources.map((resource) =>
        resource.resourceType === ResourceType.Food ? { ...resource, stockpile: 50 } : resource
      )
    });
    expect(
      foodScarce.intents.some(
        (intent) => intent.kind === "assign_gatherers" && intent.reasonCode.startsWith("economy:surplus_transfer")
      )
    ).toBe(false);
  });
});
