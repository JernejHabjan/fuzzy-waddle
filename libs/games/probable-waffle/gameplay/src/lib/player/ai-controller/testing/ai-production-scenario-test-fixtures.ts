import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";

import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";

import { AiMacroManager } from "../planning/ai-macro-manager";
import type { AiManagerProposalV1 } from "../planning/ai-manager-proposal";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";

import { createAiTestObservation, createAiTestOwnedActor } from "./ai-test-fixtures";

/** A pure scenario pairs semantic subject/control assertions with repeatable proposal execution. */
export interface AiProductionPureScenarioV1 {
  readonly scenarioId: "PRO-01" | "PRO-02" | "PRO-03" | "PRO-04" | "PRO-05";
  readonly purpose: string;
  readonly execute: () => { readonly subject: AiManagerProposalV1; readonly control?: AiManagerProposalV1 };
  readonly assertSemanticEffect: (result: ReturnType<AiProductionPureScenarioV1["execute"]>) => void;
}

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);

export const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "worker",
      family: "worker",
      sourceObjectName: ObjectNames.TivaraWorkerMale,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [ObjectNames.AnkGuard],
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
      produces: [ObjectNames.TivaraMacemanMale, ObjectNames.TivaraSlingshotFemale],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 200 },
        footprintRadiusTiles: 0,
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

export function completedOpeningState(faction = FactionType.Tivara) {
  return createAiBrainStateV1({
    playerNumber: 1,
    faction,
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

export function workers(faction: "Tivara" | "Skaduwee" = "Tivara") {
  const workerName = faction === "Tivara" ? ObjectNames.TivaraWorkerMale : ObjectNames.SkaduweeWorkerMale;
  return Array.from({ length: 6 }, (_, index) => ({
    ...createAiTestOwnedActor(`worker-${faction}-${index}`),
    objectName: workerName
  }));
}

export function producer(actorId: string, objectName: ObjectNames = ObjectNames.AnkGuard) {
  return { ...createAiTestOwnedActor(actorId), objectName };
}

function constructionCells() {
  return Array.from({ length: 25 }, (_, index) => {
    const x = 7 + (index % 5);
    const y = 7 + Math.floor(index / 5);
    return {
      tileKey: `${x},${y}`,
      position: { x, y, z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    };
  });
}

/** Funds the ordinary capacity workload; explicit resource arguments retain exact affordability controls. */
export function propose(
  actors: ReturnType<typeof createAiTestObservation>["actors"],
  catalogInput = catalog,
  state = completedOpeningState(),
  faction = FactionType.Tivara,
  resources = createAiTestObservation().resources.map((resource) => ({ ...resource, stockpile: 230 }))
): AiManagerProposalV1 {
  const observation = createAiTestObservation();
  return new AiMacroManager(() => catalogInput).propose(
    {
      ...observation,
      faction,
      tick: 200,
      actors,
      resources,
      map: { ...observation.map!, constructionCells: constructionCells() }
    },
    state
  );
}

export function production(intents: readonly AiIntentV1[]) {
  return intents.filter(
    (intent): intent is Extract<AiIntentV1, { readonly kind: "produce" }> =>
      intent.kind === "produce" && intent.demandId === "demand:composition:first-squad"
  );
}

export function capacityConstruction(
  intents: readonly AiIntentV1[]
): readonly Extract<AiIntentV1, { readonly kind: "construct" }>[] {
  return intents.filter(
    (intent): intent is Extract<AiIntentV1, { readonly kind: "construct" }> =>
      intent.kind === "construct" && intent.demandId === "demand:capacity:first-army"
  );
}

/** Prices one military product and aligns both factions' worker construction authority with its producer. */
export function oneTypeCatalog(faction: "Tivara" | "Skaduwee" = "Tivara"): AiCapabilityCatalogV1 {
  const producerName = faction === "Tivara" ? ObjectNames.AnkGuard : ObjectNames.InfantryInn;
  const workerName = faction === "Tivara" ? ObjectNames.TivaraWorkerMale : ObjectNames.SkaduweeWorkerMale;
  const frontlineName = faction === "Tivara" ? ObjectNames.TivaraMacemanMale : ObjectNames.SkaduweeWarriorMale;
  const rangedName = faction === "Tivara" ? ObjectNames.TivaraSlingshotFemale : ObjectNames.SkaduweeRangedFemale;
  return {
    ...catalog,
    entries: catalog.entries.map((entry) =>
      entry.sourceObjectName === ObjectNames.TivaraWorkerMale
        ? { ...entry, sourceObjectName: workerName, constructs: [producerName] }
        : entry.sourceObjectName === ObjectNames.AnkGuard
          ? { ...entry, sourceObjectName: producerName, produces: [frontlineName] }
          : entry.sourceObjectName === ObjectNames.TivaraMacemanMale
            ? {
                ...entry,
                sourceObjectName: frontlineName,
                constructionProfile: {
                  resourceCost: { [ResourceType.Wood]: 35 },
                  footprintRadiusTiles: 0,
                  visionRange: 6,
                  navigableHeight: null,
                  enterHeight: null,
                  exitHeight: null
                }
              }
            : entry.sourceObjectName === ObjectNames.TivaraSlingshotFemale
              ? { ...entry, sourceObjectName: rangedName, produces: [] }
              : entry
    )
  };
}

/** Existing useful copies remain legal beneficiaries; producer lane occupancy is observed separately. */
export function repeatedArmy(count: number, unitName: ObjectNames = ObjectNames.TivaraMacemanMale) {
  return Array.from({ length: count }, (_, index) => ({
    ...createAiTestOwnedActor(`military-${index}`),
    objectName: unitName
  }));
}

/** A real typed queue commitment fills a deficit even while another producer's lane remains idle. */
export function queuedProducer(
  count: number,
  producerName: ObjectNames = ObjectNames.AnkGuard,
  unitName: ObjectNames = ObjectNames.TivaraMacemanMale
) {
  const items = Array.from({ length: count }, (_, index) => ({
    itemId: `queued-${index}`,
    kind: "production" as const,
    objectName: unitName,
    researchType: null
  }));
  return {
    ...producer("producer-1", producerName),
    queue: {
      status: "known" as const,
      observedTick: 200,
      value: { capacity: 5, occupied: count, itemIds: items.map((item) => item.itemId), items }
    }
  };
}
