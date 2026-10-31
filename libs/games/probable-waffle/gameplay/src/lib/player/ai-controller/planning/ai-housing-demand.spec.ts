import {
  FactionType,
  ObjectNames,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiTestObservation, createAiTestOwnedActor, requireAiTestEntry } from "../testing/ai-test-fixtures";
import { calculateAiHousingDemand } from "./ai-housing-demand";
import { AiMacroManager } from "./ai-macro-manager";

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
      constructs: [ObjectNames.Olival],
      researches: [],
      gathers: [ResourceType.Wood],
      housingCapacity: null,
      housingCost: 1,
      cargoCapacity: null
    },
    {
      capabilityId: "housing",
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
      cargoCapacity: null,
      constructionProfile: {
        resourceCost: { [ResourceType.Wood]: 80 },
        footprintRadiusTiles: 1,
        visionRange: 4,
        navigableHeight: null,
        enterHeight: null,
        exitHeight: null
      }
    },
    {
      capabilityId: "unit",
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
    }
  ]
};

function housing(actorId: string, constructionProgress = 100) {
  return {
    ...createAiTestOwnedActor(actorId),
    objectName: ObjectNames.Olival,
    housingCapacity: { status: "known" as const, value: 8, observedTick: 20 },
    housingCost: { status: "known" as const, value: 0, observedTick: 20 },
    constructionProgress: { status: "known" as const, value: constructionProgress, observedTick: 20 }
  };
}

function queuedProducer(itemCount: number) {
  return {
    ...createAiTestOwnedActor("producer"),
    housingCost: { status: "known" as const, value: 0, observedTick: 20 },
    queue: {
      status: "known" as const,
      observedTick: 20,
      value: {
        capacity: 8,
        occupied: itemCount,
        itemIds: Array.from({ length: itemCount }, (_, index) => `queue-${index}`),
        items: Array.from({ length: itemCount }, (_, index) => ({
          itemId: `queue-${index}`,
          kind: "production" as const,
          objectName: ObjectNames.TivaraMacemanMale,
          researchType: null
        }))
      }
    }
  };
}

describe("housing capacity demand", () => {
  it("rebuilds a legal housing core when the preferred house loses its prerequisite", () => {
    const house = catalog.entries[1]!;
    const recoveryCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        { ...catalog.entries[0]!, constructs: [ObjectNames.Olival, ObjectNames.Sandhold] },
        {
          ...house,
          constructionProfile: { ...house.constructionProfile!, requiredObjectNames: [ObjectNames.Sandhold] }
        },
        {
          ...house,
          sourceObjectName: ObjectNames.Sandhold,
          constructionProfile: {
            ...house.constructionProfile!,
            resourceCost: { [ResourceType.Wood]: 400, [ResourceType.Stone]: 400 }
          }
        }
      ]
    };
    const worker = createAiTestOwnedActor("worker");
    const base = createAiTestObservation();
    const demand = (actors: typeof base.actors, options = recoveryCatalog) =>
      calculateAiHousingDemand({ ...base, actors }, options, ObjectNames.Olival, 3, []);
    expect(demand([worker]).housingEntry).toMatchObject({
      sourceObjectName: ObjectNames.Sandhold,
      constructionProfile: { resourceCost: { wood: 400, stone: 400 } }
    });
    const site = { ...housing("core", 50), objectName: ObjectNames.Sandhold };
    expect(demand([worker, site])).toMatchObject({ neededBuildings: 0 });
    const crowded = Array.from({ length: 20 }, (_, index) => createAiTestOwnedActor(`crowded-${index}`));
    expect(demand(crowded).neededBuildings).toBe(1);
    expect(demand([...crowded, site]).neededBuildings).toBe(0);
    expect(
      demand([worker, { ...site, constructionProgress: { status: "known", value: 100, observedTick: 20 } }])
        .housingEntry?.sourceObjectName
    ).toBe(ObjectNames.Olival);
    expect(
      demand([worker], {
        ...recoveryCatalog,
        entries: recoveryCatalog.entries.map((entry) =>
          entry.sourceObjectName === worker.objectName ? { ...entry, constructs: [ObjectNames.Olival] } : entry
        )
      }).housingEntry
    ).toBeUndefined();
  });

  it("H-18: replaces lost capacity while queued population and a visible paid site are each counted once", () => {
    const base = createAiTestObservation();
    const workers = Array.from({ length: 7 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const surviving = housing("survivor");
    const queue = queuedProducer(4);
    const lost = calculateAiHousingDemand(
      { ...base, actors: [...workers, surviving, queue] },
      catalog,
      ObjectNames.Olival,
      3,
      []
    );
    expect(lost).toMatchObject({ readyCapacity: 8, used: 7, queuedPopulation: 4, neededBuildings: 1 });
    const paidSite = { ...housing("replacement", 50), activeEffectIds: ["effect:supply:replacement"] };
    const pending = calculateAiHousingDemand(
      { ...base, actors: [...workers, surviving, queue, paidSite] },
      catalog,
      ObjectNames.Olival,
      3,
      ["effect:supply:replacement"]
    );
    expect(pending).toMatchObject({ queuedPopulation: 4, neededBuildings: 0, acceptedEffectIds: [] });
    expect(pending.constructing.map((actor) => actor.actorId)).toEqual(["replacement"]);
    const completed = calculateAiHousingDemand(
      {
        ...base,
        actors: [
          ...workers,
          surviving,
          queue,
          { ...paidSite, constructionProgress: { status: "known", value: 100, observedTick: 40 } }
        ]
      },
      catalog,
      ObjectNames.Olival,
      3,
      ["effect:supply:replacement"]
    );
    expect(completed).toMatchObject({
      readyCapacity: 16,
      queuedPopulation: 4,
      neededBuildings: 0,
      acceptedEffectIds: []
    });
  });
  it("prebuilds a useful house for queued population even while current supply looks sufficient", () => {
    const workers = Array.from({ length: 4 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const observation = {
      ...createAiTestObservation(),
      actors: [...workers, housing("house"), queuedProducer(4)]
    };
    const demand = calculateAiHousingDemand(observation, catalog, ObjectNames.Olival, 3, []);

    expect(demand).toMatchObject({ readyCapacity: 8, used: 4, queuedPopulation: 4, neededBuildings: 1 });
    expect(demand.desiredBuildingCount).toBe(2);
    expect(
      calculateAiHousingDemand(
        { ...observation, actors: [...workers, housing("house"), queuedProducer(0)] },
        catalog,
        ObjectNames.Olival,
        3,
        []
      ).neededBuildings
    ).toBe(0);
  });

  it("counts unfinished and accepted capacity once instead of duplicating the same house", () => {
    const workers = Array.from({ length: 4 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const base = createAiTestObservation();
    const actors = [...workers, housing("house"), queuedProducer(4)];
    const constructing = calculateAiHousingDemand(
      { ...base, actors: [...actors, { ...housing("site", 50), activeEffectIds: ["effect:supply"] }] },
      catalog,
      ObjectNames.Olival,
      3,
      ["effect:supply" as never]
    );
    const accepted = calculateAiHousingDemand({ ...base, actors }, catalog, ObjectNames.Olival, 3, [
      "effect:supply" as never
    ]);

    expect(constructing.neededBuildings).toBe(0);
    expect(accepted.neededBuildings).toBe(0);
    expect(constructing.acceptedEffectIds).toEqual([]);
    expect(constructing.constructing.map((actor) => actor.actorId)).toEqual(["site"]);
  });

  it("ECO-07: prebuilds legal housing for queued population but not the ample-supply control", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 20,
      archetypeId: "balanced",
      completedOpeningStepIds: [
        "step:opening:bootstrap-worker",
        "step:opening:supply-safety",
        "step:opening:first-producer",
        "step:opening:sustainable-food"
      ]
    });
    const base = createAiTestObservation();
    const cells = Array.from({ length: 25 }, (_, index) => {
      const x = 8 + (index % 5);
      const y = 8 + Math.floor(index / 5);
      return {
        tileKey: `${x},${y}`,
        position: { x, y, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      };
    });
    const workers = Array.from({ length: 4 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const proposal = (queued: number) =>
      new AiMacroManager(() => catalog).propose(
        {
          ...base,
          actors: [...workers, housing("house"), queuedProducer(queued)],
          map: { ...base.map!, constructionCells: cells },
          resources: [
            { ...requireAiTestEntry(base.resources, 0), stockpile: 200, reservedUnspent: 0, obligationsDue: 0 }
          ]
        },
        state
      );
    const subject = proposal(4);
    const control = proposal(0);
    expect(new Set(Array.from({ length: 3 }, () => digestCanonicalAiValue(proposal(4)))).size).toBe(1);

    expect(subject.statePatch?.economyProduction?.demands).toEqual(
      expect.arrayContaining([expect.objectContaining({ purpose: "supply_buffer", unit: "actor_count", desired: 2 })])
    );
    expect(subject.intents).toContainEqual(
      expect.objectContaining({ kind: "construct", objectName: ObjectNames.Olival })
    );
    const housingIntent = subject.intents.find(
      (intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Olival
    );
    expect(housingIntent?.claims).toContainEqual(
      expect.objectContaining({ kind: "resource", resourceType: ResourceType.Wood, amount: 80 })
    );
    expect(housingIntent?.utility).toBe(920);
    expect(
      control.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Olival)
    ).toBe(false);
  });
});
