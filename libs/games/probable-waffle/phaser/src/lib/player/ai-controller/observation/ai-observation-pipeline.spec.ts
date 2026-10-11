import {
  canonicalizeAiObservationV1,
  digestCanonicalAiValue,
  type AiObservationV1
} from "@fuzzy-waddle/probable-waffle-gameplay";
import { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  accumulateObservationInvalidationDebt,
  decayObservationConfidence,
  isCurrentObservationGeneration,
  isRememberedContactExpired,
  normalizeGatherResourceTypes,
  normalizeAiObservationMemoryState,
  selectBoundedObservationWork
} from "./ai-observation-pipeline";

const unknown = { status: "unknown", reason: "not_observed" } as const;

function observation(): AiObservationV1 {
  return {
    schemaVersion: 1,
    generation: 7,
    tick: 120,
    playerNumber: 1,
    faction: FactionType.Tivara,
    actors: [
      {
        actorId: "enemy-b",
        objectName: ObjectNames.TivaraWorker,
        owner: 2,
        relation: "enemy",
        visibility: "last_seen",
        evidenceId: "evidence:contact:enemy-b",
        observedTick: 80,
        logicalPosition: { status: "known", value: { x: 2, y: 3, z: 0 }, observedTick: 80 },
        accessNodeId: { status: "known", value: "access:2:3:0", observedTick: 80 },
        effectiveLevel: unknown,
        capabilities: [],
        queue: unknown,
        cost: unknown,
        housingCost: unknown,
        housingCapacity: unknown,
        resourceState: unknown,
        activeEffectIds: []
      },
      {
        actorId: "self-a",
        objectName: ObjectNames.TivaraWorker,
        owner: 1,
        relation: "self",
        visibility: "owned",
        evidenceId: "evidence:contact:self-a",
        observedTick: 120,
        logicalPosition: { status: "known", value: { x: 1, y: 2, z: 0 }, observedTick: 120 },
        accessNodeId: { status: "known", value: "access:1:2:0", observedTick: 120 },
        effectiveLevel: { status: "known", value: 1, observedTick: 120 },
        capabilities: [],
        queue: unknown,
        cost: unknown,
        housingCost: unknown,
        housingCapacity: unknown,
        resourceState: unknown,
        activeEffectIds: []
      }
    ],
    resources: [
      {
        resourceType: ResourceType.Food,
        stockpile: 10,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: unknown
      }
    ],
    accessProducts: [],
    effects: [],
    modeGoals: [],
    researchCandidates: [],
    threatSummary: {
      observedTick: 120,
      visibleEnemyActorIds: [],
      rememberedEnemyActorIds: ["enemy-b"],
      observedCapabilityFamilies: []
    },
    map: {
      bounds: { status: "known", value: { width: 32, height: 16 }, observedTick: 120 },
      staticRevision: 5,
      frontierAccessNodeIds: ["access:9:2:0", "access:1:2:0"],
      scoutCoverageAccessNodeIds: ["access:1:2:0"],
      dynamicObstacleActorIds: ["self-a", "enemy-b"],
      regionGeneration: { generation: 7, status: "not_ready", continuationCursor: 3 }
    }
  };
}

describe("Stage 4 observation generation guards", () => {
  it("allows only the latest generation to commit", () => {
    expect(isCurrentObservationGeneration(8, 8)).toBe(true);
    expect(isCurrentObservationGeneration(8, 7)).toBe(false);
  });

  it("decays remembered evidence without creating another sighting", () => {
    expect(decayObservationConfidence(1000, 0)).toBe(1000);
    expect(decayObservationConfidence(1000, 25)).toBe(975);
    expect(decayObservationConfidence(20, 30)).toBe(0);
    expect(isRememberedContactExpired(0, 1200)).toBe(false);
    expect(isRememberedContactExpired(0, 1201)).toBe(true);
  });

  it("projects worker gather capability without admitting unknown resource strings", () => {
    expect(normalizeGatherResourceTypes([ResourceType.Wood, "invalid", ResourceType.Food])).toEqual([
      ResourceType.Food,
      ResourceType.Wood
    ]);
  });

  it("keeps map/frontier and last-seen data deterministic under input permutation", () => {
    const first = canonicalizeAiObservationV1(observation());
    const second = canonicalizeAiObservationV1({
      ...observation(),
      actors: [...observation().actors].reverse(),
      map: {
        ...observation().map!,
        frontierAccessNodeIds: [...observation().map!.frontierAccessNodeIds].reverse(),
        scoutCoverageAccessNodeIds: [...observation().map!.scoutCoverageAccessNodeIds].reverse(),
        dynamicObstacleActorIds: [...observation().map!.dynamicObstacleActorIds].reverse()
      },
      threatSummary: {
        ...observation().threatSummary,
        rememberedEnemyActorIds: [...observation().threatSummary.rememberedEnemyActorIds].reverse()
      }
    });
    expect(first).toEqual(second);
    expect(digestCanonicalAiValue(first)).toBe(digestCanonicalAiValue(second));
    expect(first.actors.find((actor) => actor.actorId === "enemy-b")?.visibility).toBe("last_seen");
  });

  it("H-19/H-20 schedules only bounded optional access work and preserves a fair continuation", () => {
    const first = selectBoundedObservationWork(["a", "b", "c", "d", "e"], 0, 4);
    const next = selectBoundedObservationWork(["a", "b", "c", "d", "e"], first.nextCursor, 4);
    expect(first).toEqual({ selected: ["a", "b", "c", "d"], nextCursor: 4 });
    expect(next).toEqual({ selected: ["e", "a", "b", "c"], nextCursor: 3 });
    expect(accumulateObservationInvalidationDebt(0)).toBe(1);
    expect(accumulateObservationInvalidationDebt(1024)).toBe(1024);
  });

  it("restores bounded canonical memory without restoring any live actor handle", () => {
    const memory = normalizeAiObservationMemoryState({
      schemaVersion: 1,
      generation: 7,
      committedTick: 120,
      knowledgeRevision: 4,
      queryInputRevision: 8,
      queryContinuationCursor: 2,
      invalidationDebt: 9999,
      contacts: [
        {
          actorId: "enemy-b",
          objectName: ObjectNames.TivaraWorker,
          owner: 2,
          relation: "enemy",
          evidenceId: "evidence:contact:enemy-b",
          lastSeenTick: 80,
          confidencePermille: 800,
          position: { x: 2, y: 3, z: 0 }
        },
        {
          actorId: "enemy-b",
          objectName: ObjectNames.TivaraWorker,
          owner: 2,
          relation: "enemy",
          evidenceId: "evidence:contact:enemy-b",
          lastSeenTick: 81,
          confidencePermille: 750,
          position: { x: 4, y: 3, z: 0 }
        }
      ]
    });
    expect(memory).toMatchObject({ invalidationDebt: 1024 });
    expect(memory?.contacts).toEqual([
      expect.objectContaining({ actorId: "enemy-b", lastSeenTick: 81, position: { x: 4, y: 3, z: 0 } })
    ]);
    expect(memory?.contacts[0]).not.toHaveProperty("gameObject");
  });
});
