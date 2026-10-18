import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiObservedActorV1, AiObservationV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";

export const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);

export const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "worker",
      family: "build",
      sourceObjectName: ObjectNames.TivaraWorker,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [ObjectNames.Wall, ObjectNames.WatchTower, ObjectNames.Stairs, ObjectNames.Olival],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    },
    {
      capabilityId: "wall",
      family: "passive",
      sourceObjectName: ObjectNames.Wall,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Stone]: 25 },
        footprintRadiusTiles: 0,
        visionRange: 10,
        navigableHeight: 42,
        enterHeight: 64,
        exitHeight: 64
      }
    },
    {
      capabilityId: "tower",
      family: "attack",
      sourceObjectName: ObjectNames.WatchTower,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: ["ground", "water"],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Stone]: 250 },
        footprintRadiusTiles: 0,
        visionRange: 18,
        navigableHeight: 104,
        enterHeight: 64,
        exitHeight: 64
      }
    },
    {
      capabilityId: "stairs",
      family: "passive",
      sourceObjectName: ObjectNames.Stairs,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Stone]: 25 },
        footprintRadiusTiles: 0,
        visionRange: 10,
        navigableHeight: 24,
        enterHeight: 0,
        exitHeight: 64
      }
    },
    {
      capabilityId: "gate-double",
      family: "passive",
      sourceObjectName: ObjectNames.Olival,
      effectiveLevel: 1,
      movementDomains: ["ground"],
      targetDomains: [],
      produces: [],
      constructs: [],
      researches: [],
      gathers: [],
      housingCapacity: null,
      housingCost: null,
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Stone]: 50 },
        footprintRadiusTiles: 0,
        visionRange: 8,
        navigableHeight: 0,
        enterHeight: 0,
        exitHeight: 0
      }
    }
  ]
};

export function actor(
  actorId: string,
  objectName: ObjectNames,
  x: number,
  y: number,
  relation: "self" | "enemy" = "self"
): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName,
    owner: relation === "self" ? 1 : 2,
    relation,
    visibility: relation === "self" ? "owned" : "visible",
    logicalPosition: { status: "known", value: { x, y, z: 0 }, observedTick: 100 },
    accessNodeId: { status: "known", value: "access:main", observedTick: 100 },
    ...(relation === "self"
      ? { mainBuilding: { status: "known" as const, value: objectName === ObjectNames.Sandhold, observedTick: 100 } }
      : {})
  };
}

export function observation(extraActors: readonly AiObservedActorV1[] = [], tick = 100): AiObservationV1 {
  const cells = [];
  for (let y = 0; y <= 20; y += 1) {
    for (let x = 0; x <= 20; x += 1) {
      const anchor = x === 9 && (y === 6 || y === 14);
      cells.push({
        tileKey: `${x},${y}`,
        position: { x, y, z: 0 },
        groundPassable: !anchor,
        waterPassable: false,
        elevation: 0,
        observedBlocked: anchor
      });
    }
  }
  return {
    ...createAiTestObservation(),
    generation: 1,
    tick,
    actors: [
      actor("main", ObjectNames.Sandhold, 5, 10),
      actor("worker", ObjectNames.TivaraWorker, 6, 10),
      actor("worker-reserve", ObjectNames.TivaraWorker, 6, 11),
      actor("enemy", ObjectNames.SkaduweeWorker, 18, 10, "enemy"),
      ...extraActors
    ],
    resources: [
      {
        resourceType: ResourceType.Stone,
        stockpile: 5_000,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known", value: 20, observedTick: tick }
      }
    ],
    threatSummary: {
      observedTick: tick,
      visibleEnemyActorIds: ["enemy"],
      rememberedEnemyActorIds: [],
      observedCapabilityFamilies: ["attack"]
    },
    map: {
      bounds: { status: "known", value: { width: 21, height: 21 }, observedTick: tick },
      staticRevision: 1,
      frontierAccessNodeIds: [],
      scoutCoverageAccessNodeIds: [],
      dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
      constructionCells: cells
    }
  };
}

export function threatenedState(): AiBrainStateV1 {
  const initial = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "opening:1:balanced"
  });
  return {
    ...initial,
    bases: [
      {
        baseId: "base:main:main",
        anchorActorId: "main",
        memberActorIds: ["main", "worker", "worker-reserve"],
        active: true,
        lifecycle: "active",
        anchorPosition: { x: 5, y: 10, z: 0 }
      }
    ],
    skirmish: {
      ...initial.skirmish,
      incidents: [
        {
          incidentId: "incident:front",
          baseId: "base:main:main",
          regionId: "access:main",
          hostileActorIds: ["enemy"],
          kind: "army_pressure",
          confidencePermille: 1000,
          severity: 700,
          createdTick: 80,
          expiresAt: aiDeadline(300)
        }
      ]
    }
  };
}
