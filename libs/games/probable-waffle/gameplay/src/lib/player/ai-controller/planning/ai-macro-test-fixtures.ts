import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";

import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";

import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";

/** Shared authored capability facts for macro controls; this is not a runtime definition catalog. */
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
      constructs: [ObjectNames.Olival, ObjectNames.AnkGuard, ObjectNames.Granary, ObjectNames.Field],
      researches: [],
      gathers: [ResourceType.Wood, ResourceType.Food],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    },
    {
      capabilityId: "main",
      family: "producer",
      sourceObjectName: ObjectNames.Sandhold,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [ObjectNames.TivaraWorker],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null
    },
    {
      capabilityId: "house",
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
      cargoCapacity: null
    },
    {
      capabilityId: "field",
      family: "resource_source",
      sourceObjectName: ObjectNames.Field,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 60 },
        footprintRadiusTiles: 0,
        visionRange: 2,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    },
    {
      capabilityId: "barracks",
      family: "producer",
      sourceObjectName: ObjectNames.AnkGuard,
      effectiveLevel: 1,
      movementDomains: [],
      targetDomains: [],
      produces: [ObjectNames.TivaraMacemanMale, ObjectNames.TivaraSlingshotFemale],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 200 },
        footprintRadiusTiles: 1,
        visionRange: 6,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    },
    {
      capabilityId: "frontline",
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
      cargoCapacity: null
    }
  ]
};

/** Marks only opening completion; each test supplies the current workforce/force/queue evidence it needs. */
export function completedOpeningState() {
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  return createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 200,
    archetypeId: "balanced",
    completedOpeningStepIds: [
      "step:opening:bootstrap-worker",
      "step:opening:supply-safety",
      "step:opening:first-producer",
      "step:opening:sustainable-food"
    ]
  });
}
