import { FactionType, ObjectNames, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "./ai-test-fixtures";

/** Pure permitted facts only; this builder is never an applied-world runtime adapter. */
export function createAiProductionPolicyFixture(faction: FactionType = FactionType.Tivara) {
  const workerName = faction === FactionType.Tivara ? ObjectNames.TivaraWorkerMale : ObjectNames.SkaduweeWorkerMale;
  const producerName = faction === FactionType.Tivara ? ObjectNames.AnkGuard : ObjectNames.InfantryInn;
  const unitName = faction === FactionType.Tivara ? ObjectNames.TivaraMacemanMale : ObjectNames.SkaduweeWarriorMale;
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  const initial = createAiBrainStateV1({
    playerNumber: 1, faction, profile, tick: 100, archetypeId: "balanced",
    completedOpeningStepIds: ["step:opening:bootstrap-worker", "step:opening:supply-safety",
      "step:opening:first-producer", "step:opening:sustainable-food"]
  });
  const state = {
    ...initial,
    strategy: { ...initial.strategy, assessment: {
      choice: "pressure" as const, reason: "assembling_compatible_force", targetActorId: "objective",
      routeDomain: "ground" as const, readyForce: 0, requiredForce: 12, visibleThreatCount: 0,
      confidencePermille: 1000, expectedEffectTick: 900, reconsiderTick: 240, alternatives: []
    } }
  };
  const catalog: AiCapabilityCatalogV1 = {
    schemaVersion: 1, generation: 1, unsupported: [],
    entries: [
      {
        capabilityId: "worker", family: "worker", sourceObjectName: workerName, effectiveLevel: 1,
        movementDomains: ["ground"], targetDomains: [], produces: [], constructs: [producerName], researches: [],
        gathers: [ResourceType.Wood, ResourceType.Food], housingCapacity: null, housingCost: 1, cargoCapacity: null
      },
      {
        capabilityId: "producer", family: "produce", sourceObjectName: producerName, effectiveLevel: 1,
        movementDomains: [], targetDomains: [], produces: [unitName], constructs: [], researches: [], gathers: [],
        housingCapacity: null, housingCost: null, cargoCapacity: null,
        productionTiming: { durationTicks: 100, singleBuilderTicks: 100, lanes: 1 },
        constructionProfile: { resourceCost: { [ResourceType.Wood]: 200 }, footprintRadiusTiles: 0,
          visionRange: 6, navigableHeight: null, enterHeight: null, exitHeight: null }
      },
      {
        capabilityId: "unit", family: "frontline", sourceObjectName: unitName, effectiveLevel: 1,
        movementDomains: ["ground"], targetDomains: ["ground"], produces: [], constructs: [], researches: [], gathers: [],
        housingCapacity: null, housingCost: 1, cargoCapacity: null,
        productionTiming: { durationTicks: 50, singleBuilderTicks: null, lanes: 1 },
        constructionProfile: { resourceCost: { [ResourceType.Food]: 25 }, footprintRadiusTiles: 0,
          visionRange: 6, navigableHeight: null, enterHeight: null, exitHeight: null }
      }
    ]
  };
  const producer: AiObservedActorV1 = {
    ...createAiTestOwnedActor("producer"), objectName: producerName,
    logicalPosition: { status: "known", value: { x: 8, y: 5, z: 0 }, observedTick: 200 },
    queue: { status: "known", value: { capacity: 5, occupied: 0, itemIds: [], items: [] }, observedTick: 200 },
    housingCost: { status: "known", value: 0, observedTick: 200 },
    constructionProgress: { status: "known", value: 100, observedTick: 200 }
  };
  const objective: AiObservedActorV1 = {
    ...createAiTestOwnedActor("objective"), objectName: ObjectNames.FrostForge,
    owner: 2, relation: "enemy", visibility: "visible", observedTick: 200,
    logicalPosition: { status: "known", value: { x: 30, y: 5, z: 0 }, observedTick: 200 }
  };
  const observation: AiObservationV1 = {
    ...createAiTestObservation(), faction, tick: 200,
    actors: [
      ...Array.from({ length: 6 }, (_, index) => ({ ...createAiTestOwnedActor(`worker-${index}`), objectName: workerName })),
      producer, objective,
      { ...createAiTestOwnedActor("housing"), housingCost: { status: "known", value: 0, observedTick: 200 },
        housingCapacity: { status: "known", value: 30, observedTick: 200 } }
    ],
    resources: Object.values(ResourceType).map((resourceType) => ({ resourceType, stockpile: 1000,
      reservedUnspent: 0, obligationsDue: 0, deliveredIncomePerMinute: { status: "unknown", reason: "not_supported" } })),
    threatSummary: { observedTick: 200, visibleEnemyActorIds: ["objective"], rememberedEnemyActorIds: [],
      observedCapabilityFamilies: [] },
    map: {
      bounds: { status: "known", value: { width: 50, height: 50 }, observedTick: 200 },
      staticRevision: 1, frontierAccessNodeIds: [], scoutCoverageAccessNodeIds: [], dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      constructionCells: Array.from({ length: 121 }, (_, index) => {
        const x = index % 11;
        const y = Math.floor(index / 11);
        return { tileKey: `${x},${y}`, position: { x, y, z: 0 }, groundPassable: true,
          waterPassable: false, elevation: 0, observedBlocked: false };
      })
    }
  };
  return { state, observation, catalog, profile, producer, objective, producerName, unitName };
}

/** Current visible effective weapon facts for the pure resilience policy. */
export function createAiProducerThreat(tick = 200): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor("threat"), owner: 2, relation: "enemy", visibility: "visible", observedTick: tick,
    logicalPosition: { status: "known", value: { x: 9, y: 5, z: 0 }, observedTick: tick },
    combatProfile: { status: "known", observedTick: tick, value: {
      maxHealth: 100, maxArmour: 0, armourPermille: 0, passiveRegenerationPerSecond: 0,
      attacks: [{ damage: 10, cooldownTicks: 20, range: 3, minRange: 0, highGroundRangeBonus: 2,
        impactDelayTicks: 0, areaRadius: 0, targetDomains: ["ground"] }], healing: null, spells: [], statuses: []
    } }
  };
}
