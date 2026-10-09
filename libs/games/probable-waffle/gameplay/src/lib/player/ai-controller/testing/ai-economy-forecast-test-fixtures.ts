import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";

import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { AiMacroManager } from "../planning/ai-macro-manager";

import { projectAiResourceForecasts } from "../planning/ai-resource-forecast";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import {
  createAiTestObservation,
  createAiTestOwnedActor,
  unknownAiValue,
  requireAiTestEntry
} from "./ai-test-fixtures";

export const catalog: AiCapabilityCatalogV1 = {
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

export const demand: AiDemandV1 = {
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

/** Supplies known stock/service capacity while leaving cargo and growth unavailable. */
export function source(actorId: string, objectName: ObjectNames, resourceType: ResourceType, serviceCapacity: number) {
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

/** Builds a fixed workforce and two resource sources with independently spendable balances. */
export function world(woodStockpile: number, foodStockpile: number): AiObservationV1 {
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
      { ...requireAiTestEntry(base.resources, 0), stockpile: woodStockpile, reservedUnspent: 0, obligationsDue: 0 },
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

/** Commits the selected demand's forecast before asking macro to allocate labor or construction. */
export function proposal(
  woodStockpile: number,
  foodStockpile: number,
  demands: readonly AiDemandV1[] = [demand],
  observation = world(woodStockpile, foodStockpile),
  runtimeCatalog: AiCapabilityCatalogV1 = catalog
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
      forecasts: projectAiResourceForecasts(observation, demands, runtimeCatalog)
    }
  };
  return new AiMacroManager(() => runtimeCatalog).propose(observation, state);
}
