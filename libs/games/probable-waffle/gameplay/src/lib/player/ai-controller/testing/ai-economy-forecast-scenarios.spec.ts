import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { AiMacroManager } from "../planning/ai-macro-manager";
import { canAffordAiEconomyCost } from "../planning/ai-economy-policy";
import { projectAiResourceForecasts } from "../planning/ai-resource-forecast";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "./ai-test-fixtures";

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
      gathers: [ResourceType.Wood, ResourceType.Food],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    },
    {
      capabilityId: "producer",
      family: "producer",
      sourceObjectName: ObjectNames.AnkGuard,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [ObjectNames.TivaraSlingshotFemale],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null
    },
    {
      capabilityId: "ranged",
      family: "ranged",
      sourceObjectName: ObjectNames.TivaraSlingshotFemale,
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
        resourceCost: { [ResourceType.Wood]: 75 },
        footprintRadiusTiles: 0,
        visionRange: 6,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    }
  ]
};

const demand: AiDemandV1 = {
  demandId: "demand:forecast:ranged",
  purpose: "dated_ranged_force",
  capabilityOrRole: "ground_ranged",
  unit: "actor_count",
  desired: 6,
  satisfiedActorIds: [],
  queuedIds: [],
  constructingIds: [],
  acceptedNotObservedEffectIds: [],
  preferredObjectNames: [ObjectNames.TivaraSlingshotFemale],
  resourceObligations: {}
};

function source(actorId: string, objectName: ObjectNames, resourceType: ResourceType, serviceCapacity: number) {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName,
    owner: null,
    relation: "neutral" as const,
    visibility: "visible" as const,
    resourceState: {
      status: "known" as const,
      observedTick: 20,
      value: {
        resourceType,
        available: { status: "known" as const, value: 500, observedTick: 20 },
        carried: unknownAiValue,
        growthReadyTick: unknownAiValue,
        serviceCapacity: { status: "known" as const, value: serviceCapacity, observedTick: 20 }
      }
    }
  };
}

function world(woodStockpile: number, foodStockpile: number): AiObservationV1 {
  const base = createAiTestObservation();
  const workers = Array.from({ length: 6 }, (_, index) => ({
    ...createAiTestOwnedActor(`worker-${index}`),
    activeOrder: {
      status: "known" as const,
      observedTick: 20,
      value: index === 0 ? null : { orderType: OrderType.Gather, targetActorId: "food-source" }
    }
  }));
  return {
    ...base,
    actors: [
      ...workers,
      { ...createAiTestOwnedActor("producer"), objectName: ObjectNames.AnkGuard },
      source("wood-source", ObjectNames.Tree1, ResourceType.Wood, 2),
      source("food-source", ObjectNames.CropsWheat, ResourceType.Food, 6)
    ],
    resources: [
      { ...base.resources[0], stockpile: woodStockpile, reservedUnspent: 0, obligationsDue: 0 },
      {
        resourceType: ResourceType.Food,
        stockpile: foodStockpile,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known", value: 0, observedTick: 20 }
      }
    ]
  };
}

function proposal(
  woodStockpile: number,
  foodStockpile: number,
  demands: readonly AiDemandV1[] = [demand],
  observation = world(woodStockpile, foodStockpile)
) {
  const initial = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium),
    tick: 20,
    archetypeId: "balanced",
    completedOpeningStepIds: [
      "step:opening:bootstrap-worker",
      "step:opening:supply-safety",
      "step:opening:first-producer",
      "step:opening:sustainable-food"
    ]
  });
  const state = {
    ...initial,
    economyProduction: {
      ...initial.economyProduction,
      forecasts: projectAiResourceForecasts(observation, demands, catalog)
    }
  };
  return new AiMacroManager(() => catalog).propose(observation, state);
}

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
      expect.objectContaining({ kind: "assign_gatherers", resourceType: ResourceType.Food, sourceActorId: "food-source" })
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
      expect.objectContaining({ kind: "assign_gatherers", resourceType: ResourceType.Wood, sourceActorId: "wood-source" })
    );
    expect(surplusRuns[0]?.intents).toContainEqual(
      expect.objectContaining({ kind: "assign_gatherers", resourceType: ResourceType.Food, sourceActorId: "food-source" })
    );
  });
});
