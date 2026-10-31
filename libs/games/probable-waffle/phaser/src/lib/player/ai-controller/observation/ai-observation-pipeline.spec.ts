import {
  canonicalizeAiObservationV1,
  digestCanonicalAiValue,
  type AiObservedActorV1,
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
import { projectRememberedContacts } from "./ai-observation-memory";
import { compareAccessProductCandidates } from "./ai-observation-access-product";
import { AiObservationPipeline } from "./ai-observation-pipeline";
import type Phaser from "phaser";

const unknown = { status: "unknown", reason: "not_observed" } as const;

function accessActor(actorId: string, x: number, y: number): AiObservedActorV1 {
  return {
    actorId,
    objectName: ObjectNames.TivaraWorker,
    owner: 2,
    relation: "self",
    visibility: "owned",
    logicalPosition: { status: "known", value: { x, y, z: 0 }, observedTick: 220 }
  } as AiObservedActorV1;
}

describe("bounded access product ordering", () => {
  it("orders candidates by visible position when actor IDs reverse across worlds", () => {
    const target = accessActor("target", 1, 1);
    const fromWorldA = [
      { source: accessActor("sim-a", 33, 16), target },
      { source: accessActor("sim-z", 33, 14), target }
    ].sort(compareAccessProductCandidates);
    const fromWorldB = [
      { source: accessActor("sim-z", 33, 16), target },
      { source: accessActor("sim-a", 33, 14), target }
    ].sort(compareAccessProductCandidates);

    expect(fromWorldA.map(({ source }) => source.logicalPosition)).toEqual(
      fromWorldB.map(({ source }) => source.logicalPosition)
    );
  });
});

describe("observation actor eligibility", () => {
  it("excludes inactive and foreign-scene actor-index entries", () => {
    const scene = {} as Phaser.Scene;
    const pipeline = Object.assign(Object.create(AiObservationPipeline.prototype), { scene }) as {
      isEligibleActor(actor: Phaser.GameObjects.GameObject): boolean;
    };

    expect(
      pipeline.isEligibleActor({
        scene,
        active: true,
        getData: () => undefined
      } as unknown as Phaser.GameObjects.GameObject)
    ).toBe(true);
    expect(pipeline.isEligibleActor({ scene: {}, active: true } as unknown as Phaser.GameObjects.GameObject)).toBe(
      false
    );
    expect(pipeline.isEligibleActor({ scene, active: false } as unknown as Phaser.GameObjects.GameObject)).toBe(false);
  });

  it("remembers combatant classification without retaining hidden enemy combat stats", () => {
    const memory = new Map();
    const pipeline = Object.assign(Object.create(AiObservationPipeline.prototype), {
      memory,
      knowledgeRevision: 0
    }) as unknown as { remember(actor: AiObservedActorV1, tick: number): void };
    const visibleEnemy: AiObservedActorV1 = {
      ...observation().actors[0]!,
      objectName: ObjectNames.TivaraMacemanMale,
      visibility: "visible",
      observedTick: 100,
      logicalPosition: { status: "known", value: { x: 2, y: 3, z: 0 }, observedTick: 100 },
      capabilities: [{
        id: "enemy-maceman:attack",
        family: "military",
        level: 1,
        domains: ["ground"],
        targetDomains: ["ground"],
        capacity: { status: "known", value: 0, observedTick: 100 }
      }]
    };

    pipeline.remember(visibleEnemy, 100);
    const remembered = projectRememberedContacts(memory as never, new Set(), 160)[0];

    expect(remembered).toMatchObject({ visibility: "last_seen", wasCombatant: true, capabilities: [] });
    expect(remembered).not.toHaveProperty("combatProfile");
    expect(remembered?.housingCost).toEqual(unknown);
  });
});

describe("observation restore invalidations", () => {
  it("ignores navigation registration events until the restored controller takes its first live capture", () => {
    const listeners: (() => void)[] = [];
    const scene = {
      events: {
        on: jest.fn((_event: string, listener: () => void) => listeners.push(listener)),
        once: jest.fn()
      }
    } as unknown as Phaser.Scene;
    const pipeline = new AiObservationPipeline(scene, { playerNumber: 2 } as never);
    pipeline.setState({
      schemaVersion: 1,
      generation: 7,
      committedTick: 120,
      knowledgeRevision: 4,
      queryInputRevision: 26,
      queryContinuationCursor: 2,
      invalidationDebt: 3,
      contacts: []
    });

    listeners[0]?.();

    expect(pipeline.getState()).toMatchObject({ queryInputRevision: 26, invalidationDebt: 3 });
  });
});

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
          mainBuilding: true,
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

  it("remembers a previously observed main-building role without restoring current contact data", () => {
    const memory = normalizeAiObservationMemoryState({
      schemaVersion: 1,
      generation: 1,
      committedTick: 500,
      knowledgeRevision: 1,
      queryInputRevision: 1,
      queryContinuationCursor: 0,
      invalidationDebt: 0,
      contacts: [
        {
          actorId: "enemy-core",
          objectName: ObjectNames.Sandhold,
          owner: 2,
          relation: "enemy",
          evidenceId: "evidence:contact:enemy-core",
          lastSeenTick: 420,
          confidencePermille: 920,
          mainBuilding: true,
          wasCombatant: true,
          position: { x: 2, y: 3, z: 0 }
        }
      ]
    });
    const remembered = projectRememberedContacts(
      new Map(memory?.contacts.map((contact) => [contact.actorId, contact])),
      new Set(),
      500
    )[0];

    expect(remembered).toMatchObject({
      actorId: "enemy-core",
      visibility: "last_seen",
      wasCombatant: true,
      mainBuilding: { status: "known", value: true, observedTick: 420 },
      queue: unknown
    });
    expect(remembered).not.toHaveProperty("healthPermille");
    expect(remembered).not.toHaveProperty("gameObject");
    expect(
      normalizeAiObservationMemoryState({
        schemaVersion: 1,
        generation: 1,
        committedTick: 500,
        knowledgeRevision: 1,
        queryInputRevision: 1,
        queryContinuationCursor: 0,
        invalidationDebt: 0,
        contacts: [{ ...memory!.contacts[0], mainBuilding: "true" }]
      })?.contacts
    ).toEqual([]);
  });

  it("forgets an absent main building only when its last position is currently visible", () => {
    const contact = (actorId: string, x: number, mainBuilding: boolean) => ({
      actorId,
      objectName: ObjectNames.Sandhold,
      owner: 2,
      relation: "enemy",
      evidenceId: `evidence:contact:${actorId}`,
      lastSeenTick: 420,
      confidencePermille: 1000,
      mainBuilding,
      position: { x, y: 3, z: 0 }
    });
    const state = normalizeAiObservationMemoryState({
      schemaVersion: 1,
      generation: 1,
      committedTick: 500,
      knowledgeRevision: 1,
      queryInputRevision: 1,
      queryContinuationCursor: 0,
      invalidationDebt: 0,
      contacts: [
        contact("empty-core", 2, true),
        contact("hidden-core", 8, true),
        contact("moving-contact", 2, false),
        contact("visible-core", 2, true)
      ]
    });
    if (!state) throw new Error("missing_memory_state");
    const memory = new Map(state.contacts.map((entry) => [entry.actorId, entry]));
    const remembered = projectRememberedContacts(memory, new Set(["visible-core"]), 500, (tile) => tile.x === 2);

    expect(remembered.map((entry) => entry.actorId)).toEqual(["hidden-core", "moving-contact"]);
    expect(memory.has("empty-core")).toBe(false);
    expect(memory.has("visible-core")).toBe(true);
  });
});
