import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
import { proposeAiWorkerRecovery } from "./ai-worker-recovery";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const workerEntry = {
  capabilityId: "worker",
  family: "economy",
  sourceObjectName: ObjectNames.TivaraWorker,
  effectiveLevel: 1,
  movementDomains: ["ground" as const],
  targetDomains: [],
  produces: [],
  constructs: [],
  researches: [],
  gathers: [ResourceType.Food],
  housingCapacity: null,
  housingCost: 1,
  cargoCapacity: null,
  constructionProfile: {
    resourceCost: { [ResourceType.Food]: 50 },
    footprintRadiusTiles: 0,
    visionRange: 8,
    navigableHeight: null,
    enterHeight: null,
    exitHeight: null
  }
};
const catalog: AiCapabilityCatalogV1 = {
  schemaVersion: 1,
  generation: 1,
  unsupported: [],
  entries: [
    workerEntry,
    {
      ...workerEntry,
      capabilityId: "main",
      sourceObjectName: ObjectNames.Sandhold,
      gathers: [],
      produces: [ObjectNames.TivaraWorker],
      housingCost: 0
    }
  ]
};

function worker(id: string): AiObservedActorV1 {
  return { ...createAiTestOwnedActor(id), objectName: ObjectNames.TivaraWorker };
}

function producer(queueItemIds: readonly string[] = []): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor("home"),
    objectName: ObjectNames.Sandhold,
    queue: {
      status: "known",
      observedTick: 20,
      value: {
        capacity: 5,
        occupied: queueItemIds.length,
        itemIds: queueItemIds,
        items: queueItemIds.map((itemId) => ({
          itemId,
          kind: "production" as const,
          objectName: ObjectNames.TivaraWorker,
          researchType: null
        }))
      }
    }
  };
}

function result(workerCount: number, food: number, queueItemIds: readonly string[] = []) {
  const initial = createAiTestObservation();
  const observation = {
    ...initial,
    actors: [producer(queueItemIds), ...Array.from({ length: workerCount }, (_, index) => worker(`worker-${index}`))],
    resources: [
      {
        resourceType: ResourceType.Food,
        stockpile: food,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 20 }
      }
    ]
  };
  const state = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  return proposeAiWorkerRecovery(observation, state, catalog, ObjectNames.TivaraWorker, 6);
}

describe("worker economy replacement", () => {
  it("replaces a lost worker ahead of military spending while preserving the completed opening", () => {
    const proposal = result(5, 100);
    expect(proposal.demand).toEqual(expect.objectContaining({ desired: 6, satisfiedActorIds: expect.any(Array) }));
    expect(proposal.intent).toEqual(
      expect.objectContaining({
        kind: "produce",
        lane: "essential_economy",
        urgencyClass: 0,
        objectName: ObjectNames.TivaraWorker
      })
    );
    expect(proposal.intent?.claims).toContainEqual(
      expect.objectContaining({
        kind: "resource",
        resourceType: ResourceType.Food,
        amount: 50
      })
    );
  });

  it("counts a queued replacement and keeps a food-shortage demand without proposing an unaffordable command", () => {
    expect(result(5, 100, ["queued-worker"]).intent).toBeNull();
    const short = result(0, 30);
    expect(short.demand.desired).toBe(6);
    expect(short.intent).toBeNull();
  });
});
