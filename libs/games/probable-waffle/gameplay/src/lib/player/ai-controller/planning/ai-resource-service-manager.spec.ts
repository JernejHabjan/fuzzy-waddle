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
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { AiResourceServiceManager } from "./ai-resource-service-manager";

const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    {
      capabilityId: "worker", family: "worker", sourceObjectName: ObjectNames.TivaraWorker, effectiveLevel: 1,
      movementDomains: ["ground"], targetDomains: [], produces: [], constructs: [ObjectNames.WorkMill], researches: [],
      gathers: [ResourceType.Wood], housingCapacity: null, housingCost: 1, cargoCapacity: null
    },
    {
      capabilityId: "main", family: "drop_off", sourceObjectName: ObjectNames.Sandhold, effectiveLevel: 1,
      movementDomains: [], targetDomains: [], produces: [], constructs: [], researches: [], gathers: [],
      acceptsResources: [ResourceType.Wood], housingCapacity: null, housingCost: null, cargoCapacity: null
    },
    {
      capabilityId: "mill", family: "drop_off", sourceObjectName: ObjectNames.WorkMill, effectiveLevel: 1,
      movementDomains: [], targetDomains: [], produces: [], constructs: [], researches: [], gathers: [],
      acceptsResources: [ResourceType.Wood], housingCapacity: null, housingCost: null, cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 100 }, footprintRadiusTiles: 0, visionRange: 14,
        navigableHeight: null, enterHeight: null, exitHeight: null
      }
    }
  ]
};

function actor(id: string, objectName: ObjectNames, x: number, y: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor(id), objectName,
    logicalPosition: { status: "known", observedTick: 20, value: { x, y, z: 0 } }
  };
}

function tree(id: string, x: number): AiObservedActorV1 {
  return {
    ...actor(id, ObjectNames.Tree1, x, 5), owner: null, relation: "neutral", visibility: "visible",
    resourceState: {
      status: "known", observedTick: 20,
      value: {
        resourceType: ResourceType.Wood,
        available: { status: "known", value: 500, observedTick: 20 },
        carried: unknownAiValue, growthReadyTick: unknownAiValue,
        serviceCapacity: { status: "known", value: 4, observedTick: 20 }
      }
    }
  };
}

function world(sourceX: number, extra: readonly AiObservedActorV1[] = []): AiObservationV1 {
  const base = createAiTestObservation();
  const cells = [];
  for (let y = 1; y <= 9; y += 1) {
    for (let x = sourceX - 4; x <= sourceX + 4; x += 1) {
      cells.push({
        tileKey: `${x},${y}`,
        position: { x, y, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      });
    }
  }
  const workers = Array.from({ length: 6 }, (_, index) => ({
    ...actor(`worker-${index}`, ObjectNames.TivaraWorker, sourceX - 3, 5),
    activeOrder: {
      status: "known" as const, observedTick: 20,
      value: index === 0 ? { orderType: OrderType.Gather, targetActorId: "forest-b" } : null
    }
  }));
  return {
    ...base,
    actors: [...workers, actor("main", ObjectNames.Sandhold, 0, 5), tree("forest-b", sourceX), ...extra],
    resources: [{ ...base.resources[0], stockpile: 300, reservedUnspent: 0, obligationsDue: 0 }],
    map: {
      bounds: { status: "known", value: { width: 80, height: 20 }, observedTick: 20 },
      staticRevision: 1, frontierAccessNodeIds: [], scoutCoverageAccessNodeIds: [], dynamicObstacleActorIds: [],
      regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 }, constructionCells: cells
    }
  };
}

function proposal(observation: AiObservationV1) {
  const initial = createAiBrainStateV1({
    playerNumber: 1, faction: FactionType.Tivara,
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium), tick: 20, archetypeId: "balanced"
  });
  const state = {
    ...initial,
    economyProduction: {
      ...initial.economyProduction,
      forecasts: [{ resourceType: ResourceType.Wood, horizonTick: 620, amount: 400, confidencePermille: 800 }]
    }
  };
  return new AiResourceServiceManager(() => catalog).propose(observation, state);
}

describe("AiResourceServiceManager", () => {
  it("ECO-01: proposes a compatible nearby wood service with a legal footprint and priced claim", () => {
    const runs = Array.from({ length: 3 }, () => proposal(world(20)));
    const intent = runs[0]?.intents[0];

    expect(new Set(runs.map(digestCanonicalAiValue)).size).toBe(1);
    expect(intent).toEqual(expect.objectContaining({
      kind: "construct", objectName: ObjectNames.WorkMill, spendingCategory: "economy",
      reasonCode: expect.stringContaining("resource_service:wood:forest-b")
    }));
    expect(intent?.claims).toContainEqual(
      expect.objectContaining({ kind: "resource", resourceType: ResourceType.Wood, amount: 100 })
    );
    if (intent?.kind === "construct") {
      expect(Math.abs(intent.logicalPosition.x - 20) + Math.abs(intent.logicalPosition.y - 5)).toBeLessThanOrEqual(6);
    }
    expect(proposal(world(20, [actor("near-mill", ObjectNames.WorkMill, 19, 7)])).intents).toHaveLength(0);
  });

  it("ECO-02: permits a useful second WorkMill for a remote forest but declines an already-served control", () => {
    const firstMill = actor("first-mill", ObjectNames.WorkMill, 10, 6);
    const subject = world(30, [firstMill, tree("forest-a", 10)]);
    const control = world(30, [firstMill, tree("forest-a", 10), actor("second-mill", ObjectNames.WorkMill, 29, 6)]);
    const runs = Array.from({ length: 3 }, () => proposal(subject));
    const proposedMill = runs[0]?.intents[0];

    expect(new Set(runs.map(digestCanonicalAiValue)).size).toBe(1);
    expect(runs[0]?.intents).toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.WorkMill })
    );
    if (proposedMill?.kind === "construct") {
      const observed = world(30, [
        firstMill,
        tree("forest-a", 10),
        actor("new-mill", ObjectNames.WorkMill, proposedMill.logicalPosition.x, proposedMill.logicalPosition.y)
      ]);
      expect(observed.actors.filter((candidate) => candidate.objectName === ObjectNames.WorkMill)).toHaveLength(2);
      expect(proposal(observed).intents).toHaveLength(0);
    }
    expect(control.actors.filter((candidate) => candidate.objectName === ObjectNames.WorkMill)).toHaveLength(2);
    expect(proposal(control).intents).toHaveLength(0);
  });
});
