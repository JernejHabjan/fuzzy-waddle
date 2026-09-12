import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";
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

function completedOpeningState() {
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

describe("AiMacroManager", () => {
  it("keeps bootstrap demand stable and proposes the legal missing worker", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const observation = {
      ...createAiTestObservation(),
      actors: [
        {
          ...createAiTestOwnedActor("main"),
          objectName: ObjectNames.Sandhold,
          housingCost: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const proposal = new AiMacroManager(() => catalog).propose(observation, state);

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "produce", objectName: ObjectNames.TivaraWorker })
    );
    expect(
      proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "bootstrap_worker")?.desired
    ).toBe(6);
  });

  it("does not regress the opening workforce checkpoint after later bases appear", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const initial = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const state = {
      ...initial,
      bases: Array.from({ length: 3 }, (_, index) => ({
        baseId: `base:${index}`,
        anchorActorId: `base-actor-${index}`,
        memberActorIds: [],
        active: true,
        lifecycle: "active" as const
      }))
    };
    const workers = Array.from({ length: 6 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const proposal = new AiMacroManager(() => catalog).propose(
      { ...createAiTestObservation(), actors: workers },
      state
    );

    expect(
      proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "bootstrap_worker")
    ).toMatchObject({ desired: 6, satisfiedActorIds: expect.arrayContaining(workers.map((worker) => worker.actorId)) });
    expect(
      proposal.statePatch?.opening?.plan.steps.find((step) => step.stepId === "step:opening:bootstrap-worker")?.state
    ).toBe("completed");
  });

  it("counts typed queued workers before requesting more production", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const workers = Array.from({ length: 5 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const main = {
      ...createAiTestOwnedActor("main"),
      objectName: ObjectNames.Sandhold,
      queue: {
        status: "known" as const,
        value: {
          capacity: 5,
          occupied: 1,
          itemIds: ["main:0:Production"],
          items: [
            {
              itemId: "main:0:Production",
              kind: "production" as const,
              objectName: ObjectNames.TivaraWorker,
              researchType: null
            }
          ]
        },
        observedTick: 20
      }
    };
    const proposal = new AiMacroManager(() => catalog).propose(
      { ...createAiTestObservation(), actors: [...workers, main] },
      state
    );
    const demand = proposal.statePatch?.economyProduction?.demands.find(
      (candidate) => candidate.purpose === "bootstrap_worker"
    );

    expect(demand?.queuedIds).toEqual(["main:0:Production"]);
    expect(
      proposal.intents.some((intent) => intent.kind === "produce" && intent.objectName === ObjectNames.TivaraWorker)
    ).toBe(false);
  });

  it("assigns idle workers to the scarcest visible resource without reordering active workers", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const idleWorker: AiObservedActorV1 = {
      ...createAiTestOwnedActor("worker-idle"),
      activeOrder: { status: "known", value: null, observedTick: 20 }
    };
    const activeWorker: AiObservedActorV1 = {
      ...createAiTestOwnedActor("worker-active"),
      activeOrder: {
        status: "known",
        value: { orderType: OrderType.Gather, targetActorId: "wood-source" },
        observedTick: 20
      }
    };
    const source: AiObservedActorV1 = {
      ...createAiTestOwnedActor("wood-source"),
      owner: null,
      relation: "neutral",
      visibility: "visible",
      resourceState: {
        status: "known",
        value: {
          resourceType: ResourceType.Wood,
          available: { status: "known", value: 1000, observedTick: 20 },
          carried: { status: "unknown", reason: "not_supported" },
          growthReadyTick: { status: "unknown", reason: "not_supported" },
          serviceCapacity: { status: "known", value: 4, observedTick: 20 }
        },
        observedTick: 20
      }
    };
    const proposal = new AiMacroManager(() => catalog).propose(
      { ...createAiTestObservation(), actors: [idleWorker, activeWorker, source] },
      state
    );

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({
        kind: "assign_gatherers",
        actorIds: ["worker-idle"],
        sourceActorId: "wood-source",
        resourceType: ResourceType.Wood
      })
    );
  });

  it("counts runtime worker variants toward one canonical workforce demand", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const variantCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        ...catalog.entries,
        {
          ...catalog.entries[0]!,
          capabilityId: "worker-female",
          sourceObjectName: ObjectNames.TivaraWorkerFemale
        }
      ]
    };
    const observation = {
      ...createAiTestObservation(),
      actors: [
        ...Array.from({ length: 6 }, (_, index) => ({
          ...createAiTestOwnedActor(`worker-variant-${index}`),
          objectName: ObjectNames.TivaraWorkerFemale
        })),
        { ...createAiTestOwnedActor("main"), objectName: ObjectNames.Sandhold }
      ]
    };

    const proposal = new AiMacroManager(() => variantCatalog).propose(observation, state);
    const workerDemand = proposal.statePatch?.economyProduction?.demands.find(
      (demand) => demand.purpose === "bootstrap_worker"
    );

    expect(workerDemand?.satisfiedActorIds).toHaveLength(6);
    expect(
      proposal.intents.some((intent) => intent.kind === "produce" && intent.objectName === ObjectNames.TivaraWorker)
    ).toBe(false);
  });

  it("does not request housing when the committed supply buffer already exists", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const observation = {
      ...createAiTestObservation(),
      actors: [
        {
          ...createAiTestOwnedActor("house"),
          objectName: ObjectNames.Olival,
          housingCapacity: { status: "known" as const, value: 8, observedTick: 20 }
        }
      ]
    };
    const proposal = new AiMacroManager(() => catalog).propose(observation, state);

    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Olival)
    ).toBe(false);
  });

  it("uses only observed legal construction cells instead of guessed offsets", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const cells = [
      {
        tileKey: "8,8",
        position: { x: 8, y: 8, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      },
      {
        tileKey: "9,8",
        position: { x: 9, y: 8, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      }
    ];
    const observation = {
      ...createAiTestObservation(),
      actors: Array.from({ length: 6 }, (_, index) => createAiTestOwnedActor(`worker-${index}`)),
      map: { ...createAiTestObservation().map!, constructionCells: cells }
    };

    const proposal = new AiMacroManager(() => catalog).propose(observation, state);
    const constructionPositions = proposal.intents
      .filter((intent) => intent.kind === "construct")
      .map((intent) => intent.logicalPosition);

    expect(constructionPositions.length).toBeGreaterThan(0);
    expect(constructionPositions.every((position) => cells.some((cell) => cell.position === position))).toBe(true);
  });

  it("executes the opening in order and gives one builder only one construction commitment", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const workers = Array.from({ length: 6 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const cells = Array.from({ length: 9 }, (_, index) => {
      const x = 7 + (index % 3);
      const y = 7 + Math.floor(index / 3);
      return {
        tileKey: `${x},${y}`,
        position: { x, y, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      };
    });
    const manager = new AiMacroManager(() => catalog);
    const supply = manager.propose(
      {
        ...createAiTestObservation(),
        actors: workers,
        map: { ...createAiTestObservation().map!, constructionCells: cells }
      },
      state
    );
    const supplyConstructs = supply.intents.filter((intent) => intent.kind === "construct");

    expect(supplyConstructs).toHaveLength(1);
    expect(supplyConstructs[0]).toEqual(
      expect.objectContaining({
        objectName: ObjectNames.Olival,
        claims: expect.arrayContaining([expect.objectContaining({ kind: "actor", actorId: "worker-0" })])
      })
    );

    const openingAfterSupply = supply.statePatch?.opening;
    expect(openingAfterSupply).toBeDefined();
    const house = {
      ...createAiTestOwnedActor("house"),
      objectName: ObjectNames.Olival,
      housingCapacity: { status: "known" as const, value: 8, observedTick: 40 }
    };
    const producer = manager.propose(
      {
        ...createAiTestObservation(),
        tick: 40,
        actors: [...workers, house],
        map: { ...createAiTestObservation().map!, constructionCells: cells }
      },
      { ...state, opening: openingAfterSupply! }
    );

    expect(producer.intents.filter((intent) => intent.kind === "construct").map((intent) => intent.objectName)).toEqual(
      [ObjectNames.AnkGuard]
    );
    expect(
      producer.statePatch?.opening?.plan.steps.find((step) => step.stepId === "step:opening:supply-safety")
        ?.completedTick
    ).toBe(40);
  });

  it("waits for an actively staffed construction site instead of issuing duplicate buildings", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const workers = Array.from({ length: 6 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const constructionSite = {
      ...createAiTestOwnedActor("olival-site"),
      objectName: ObjectNames.Olival,
      constructionProgress: { status: "known" as const, value: 50, observedTick: 20 }
    };
    const assignedWorkers = workers.map((worker, index) =>
      index === 0
        ? {
            ...worker,
            activeOrder: {
              status: "known" as const,
              value: { orderType: OrderType.Build, targetActorId: constructionSite.actorId },
              observedTick: 20
            }
          }
        : worker
    );
    const proposal = new AiMacroManager(() => catalog).propose(
      { ...createAiTestObservation(), actors: [...assignedWorkers, constructionSite] },
      state
    );

    expect(proposal.intents.some((intent) => intent.kind === "construct")).toBe(false);
    expect(proposal.intents.some((intent) => intent.kind === "resume_construct")).toBe(false);
    expect(
      proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "supply_buffer")
        ?.constructingIds
    ).toEqual(["olival-site"]);
  });

  it("resumes an observed construction site after its builder is displaced", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const workers = Array.from({ length: 6 }, (_, index) => ({
      ...createAiTestOwnedActor(`worker-${index}`),
      activeOrder: { status: "known" as const, value: null, observedTick: 20 }
    }));
    const constructionSite = {
      ...createAiTestOwnedActor("olival-site"),
      objectName: ObjectNames.Olival,
      constructionProgress: { status: "known" as const, value: 54, observedTick: 20 }
    };
    const proposal = new AiMacroManager(() => catalog).propose(
      { ...createAiTestObservation(), actors: [...workers, constructionSite] },
      state
    );
    const resume = proposal.intents.find((intent) => intent.kind === "resume_construct");

    expect(resume).toMatchObject({ targetActorId: "olival-site", actorIds: ["worker-0"] });
    expect(proposal.intents.some((intent) => intent.kind === "construct")).toBe(false);
    expect(
      proposal.intents.some((intent) => intent.kind === "assign_gatherers" && intent.actorIds.includes("worker-0"))
    ).toBe(false);
  });

  it("does not reassign a worker that is already constructing", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const workers = Array.from({ length: 6 }, (_, index) => ({
      ...createAiTestOwnedActor(`worker-${index}`),
      ...(index === 0
        ? {
            activeOrder: {
              status: "known" as const,
              value: { orderType: OrderType.Build, targetActorId: "existing-site" },
              observedTick: 20
            }
          }
        : {})
    }));
    const cells = [
      {
        tileKey: "8,8",
        position: { x: 8, y: 8, z: 0 },
        groundPassable: true,
        waterPassable: false,
        elevation: 0,
        observedBlocked: false
      }
    ];
    const proposal = new AiMacroManager(() => catalog).propose(
      {
        ...createAiTestObservation(),
        actors: workers,
        map: { ...createAiTestObservation().map!, constructionCells: cells }
      },
      state
    );
    const construct = proposal.intents.find((intent) => intent.kind === "construct");

    expect(construct).toEqual(expect.objectContaining({ builderIds: ["worker-1"] }));
  });

  it("prebuilds one justified duplicate producer for the dated post-opening force", () => {
    const state = completedOpeningState();
    const workers = Array.from({ length: 6 }, (_, index) => ({
      ...createAiTestOwnedActor(`worker-${index}`),
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Gather, targetActorId: "wood" },
        observedTick: 200
      }
    }));
    const producer = { ...createAiTestOwnedActor("producer-1"), objectName: ObjectNames.AnkGuard };
    const housing = {
      ...createAiTestOwnedActor("housing"),
      objectName: ObjectNames.Olival,
      housingCapacity: { status: "known" as const, value: 20, observedTick: 200 }
    };
    const observation = {
      ...createAiTestObservation(),
      tick: 200,
      actors: [...workers, producer, housing],
      map: {
        ...createAiTestObservation().map!,
        constructionCells: Array.from({ length: 49 }, (_, index) => {
          const x = 7 + (index % 7);
          const y = 7 + Math.floor(index / 7);
          return {
            tileKey: `${x},${y}`,
            position: { x, y, z: 0 },
            groundPassable: true,
            waterPassable: false,
            elevation: 0,
            observedBlocked: false
          };
        })
      }
    };

    const proposal = new AiMacroManager(() => catalog).propose(observation, state);

    expect(proposal.statePatch?.economyProduction?.demands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ purpose: "dated_land_pressure", desired: 12 }),
        expect.objectContaining({ purpose: "dated_military_throughput", desired: 2 })
      ])
    );
    expect(proposal.intents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "construct", objectName: ObjectNames.AnkGuard }),
        expect.objectContaining({ kind: "produce", producerId: "producer-1" })
      ])
    );
  });

  it("uses every free producer and permits repeated useful unit types", () => {
    const state = completedOpeningState();
    const oneTypeCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: catalog.entries.map((entry) =>
        entry.sourceObjectName === ObjectNames.AnkGuard
          ? { ...entry, produces: [ObjectNames.TivaraMacemanMale] }
          : entry
      )
    };
    const actors = [
      ...Array.from({ length: 6 }, (_, index) => createAiTestOwnedActor(`worker-${index}`)),
      { ...createAiTestOwnedActor("producer-1"), objectName: ObjectNames.AnkGuard },
      { ...createAiTestOwnedActor("producer-2"), objectName: ObjectNames.AnkGuard }
    ];

    const proposal = new AiMacroManager(() => oneTypeCatalog).propose(
      { ...createAiTestObservation(), tick: 200, actors },
      state
    );
    const composition = proposal.intents.filter(
      (intent) => intent.kind === "produce" && intent.demandId === "demand:composition:first-squad"
    );

    expect(composition).toHaveLength(2);
    expect(composition.map((intent) => (intent.kind === "produce" ? intent.objectName : null))).toEqual([
      ObjectNames.TivaraMacemanMale,
      ObjectNames.TivaraMacemanMale
    ]);
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.AnkGuard)
    ).toBe(false);
  });

  it("stops production and capacity admission after ready and queued commitments satisfy demand", () => {
    const state = completedOpeningState();
    const military = Array.from({ length: 10 }, (_, index) => ({
      ...createAiTestOwnedActor(`military-${index}`),
      objectName: ObjectNames.TivaraMacemanMale
    }));
    const queuedProducer = (id: string) => ({
      ...createAiTestOwnedActor(id),
      objectName: ObjectNames.AnkGuard,
      queue: {
        status: "known" as const,
        value: {
          capacity: 2,
          occupied: 1,
          itemIds: [`${id}:queue`],
          items: [
            {
              itemId: `${id}:queue`,
              kind: "production" as const,
              objectName: ObjectNames.TivaraMacemanMale,
              researchType: null
            }
          ]
        },
        observedTick: 200
      }
    });
    const proposal = new AiMacroManager(() => catalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        actors: [queuedProducer("producer-1"), queuedProducer("producer-2"), ...military]
      },
      state
    );

    expect(proposal.intents.some((intent) => intent.kind === "produce")).toBe(false);
    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.AnkGuard)
    ).toBe(false);
  });

  it("creates bounded renewable food capacity after the opening instead of treating the granary as food", () => {
    const state = completedOpeningState();
    const workers = Array.from({ length: 6 }, (_, index) => ({
      ...createAiTestOwnedActor(`worker-${index}`),
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Gather, targetActorId: "wood" },
        observedTick: 200
      }
    }));
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
    const proposal = new AiMacroManager(() => catalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        actors: workers,
        map: { ...createAiTestObservation().map!, constructionCells: cells }
      },
      state
    );

    expect(proposal.statePatch?.economyProduction?.demands).toEqual(
      expect.arrayContaining([expect.objectContaining({ purpose: "renewable_food_capacity", desired: 6 })])
    );
    expect(proposal.intents).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "construct", objectName: ObjectNames.Field })])
    );
  });

  it("staffs completed renewable food sources and does not request a third Field", () => {
    const state = completedOpeningState();
    const workers = Array.from({ length: 2 }, (_, index) => createAiTestOwnedActor(`worker-${index}`));
    const fields = ["field-1", "field-2"].map((id) => ({
      ...createAiTestOwnedActor(id),
      objectName: ObjectNames.Field
    }));
    const proposal = new AiMacroManager(() => catalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        actors: [...workers, ...fields],
        resources: createAiTestObservation().resources.map((resource) =>
          resource.resourceType === ResourceType.Food ? { ...resource, stockpile: 1000 } : resource
        )
      },
      state
    );

    expect(
      proposal.intents.some((intent) => intent.kind === "construct" && intent.objectName === ObjectNames.Field)
    ).toBe(false);
    expect(proposal.intents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "assign_gatherers",
          resourceType: ResourceType.Food,
          sourceActorId: "field-1"
        })
      ])
    );
  });

  it("does not interrupt a busy food worker to cover another Field", () => {
    const state = completedOpeningState();
    const worker = {
      ...createAiTestOwnedActor("worker"),
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.ReturnResources, targetActorId: "granary" },
        observedTick: 200
      }
    };
    const fields = ["field-1", "field-2"].map((id) => ({
      ...createAiTestOwnedActor(id),
      objectName: ObjectNames.Field
    }));

    const proposal = new AiMacroManager(() => catalog).propose(
      { ...createAiTestObservation(), tick: 200, actors: [worker, ...fields] },
      state
    );

    expect(
      proposal.intents.some((intent) => intent.kind === "assign_gatherers" && intent.resourceType === ResourceType.Food)
    ).toBe(false);
    expect(
      proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "renewable_food_capacity")
    ).toMatchObject({ desired: 1 });
  });

  it("moves a worker from a generic food source onto authored renewable Field capacity", () => {
    const state = completedOpeningState();
    const worker = {
      ...createAiTestOwnedActor("worker"),
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Gather, targetActorId: "wild-food" },
        observedTick: 200
      }
    };
    const field = { ...createAiTestOwnedActor("field"), objectName: ObjectNames.Field };

    const proposal = new AiMacroManager(() => catalog).propose(
      { ...createAiTestObservation(), tick: 200, actors: [worker, field] },
      state
    );

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "assign_gatherers", actorIds: ["worker"], sourceActorId: "field" })
    );
  });

  it("selects an affordable composition unit and reserves its resources for the decision", () => {
    const state = completedOpeningState();
    const resourceCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: catalog.entries.map((entry) => {
        if (entry.sourceObjectName === ObjectNames.TivaraMacemanMale)
          return {
            ...entry,
            family: "frontline",
            constructionProfile: {
              resourceCost: { [ResourceType.Food]: 100 },
              footprintRadiusTiles: 0,
              visionRange: 8,
              navigableHeight: null,
              enterHeight: null,
              exitHeight: null
            }
          };
        if (entry.sourceObjectName === ObjectNames.TivaraSlingshotFemale)
          return {
            ...entry,
            family: "frontline",
            constructionProfile: {
              resourceCost: { [ResourceType.Food]: 50 },
              footprintRadiusTiles: 0,
              visionRange: 8,
              navigableHeight: null,
              enterHeight: null,
              exitHeight: null
            }
          };
        return entry;
      })
    };
    const resources = [
      ...createAiTestObservation().resources,
      {
        resourceType: ResourceType.Food,
        stockpile: 60,
        reservedUnspent: 0,
        obligationsDue: 0,
        deliveredIncomePerMinute: { status: "known" as const, value: 0, observedTick: 200 }
      }
    ];
    const proposal = new AiMacroManager(() => resourceCatalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        resources,
        actors: [
          { ...createAiTestOwnedActor("producer-1"), objectName: ObjectNames.AnkGuard },
          { ...createAiTestOwnedActor("producer-2"), objectName: ObjectNames.AnkGuard }
        ]
      },
      state
    );
    const composition = proposal.intents.filter((intent) => intent.kind === "produce");

    expect(composition).toHaveLength(1);
    expect(composition[0]).toEqual(
      expect.objectContaining({ objectName: ObjectNames.TivaraSlingshotFemale, producerId: "producer-1" })
    );
  });

  it("keeps land-force demand and throughput separate from air and naval production", () => {
    const state = completedOpeningState();
    const domainCatalog: AiCapabilityCatalogV1 = {
      ...catalog,
      entries: [
        ...catalog.entries.map((entry) =>
          entry.sourceObjectName === ObjectNames.Sandhold
            ? { ...entry, produces: [...entry.produces, ObjectNames.VikingBoat] }
            : entry
        ),
        {
          capabilityId: "naval",
          family: "naval",
          sourceObjectName: ObjectNames.VikingBoat,
          effectiveLevel: 1,
          movementDomains: ["water"],
          targetDomains: ["ground", "water"],
          produces: [],
          constructs: [],
          researches: [],
          gathers: [],
          housingCapacity: null,
          housingCost: 1,
          cargoCapacity: null
        },
        {
          capabilityId: "air",
          family: "air",
          sourceObjectName: ObjectNames.SkaduweeOwl,
          effectiveLevel: 1,
          movementDomains: ["air"],
          targetDomains: ["ground", "air"],
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
    const military = Array.from({ length: 10 }, (_, index) => ({
      ...createAiTestOwnedActor(`military-${index}`),
      objectName: ObjectNames.TivaraMacemanMale
    }));
    const proposal = new AiMacroManager(() => domainCatalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        actors: [
          ...military,
          { ...createAiTestOwnedActor("producer"), objectName: ObjectNames.AnkGuard },
          { ...createAiTestOwnedActor("main"), objectName: ObjectNames.Sandhold },
          { ...createAiTestOwnedActor("air-unit"), objectName: ObjectNames.SkaduweeOwl },
          { ...createAiTestOwnedActor("naval-unit"), objectName: ObjectNames.VikingBoat }
        ]
      },
      state
    );

    expect(
      proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "dated_land_pressure")
    ).toMatchObject({ desired: 12, satisfiedActorIds: expect.arrayContaining(military.map((actor) => actor.actorId)) });
    expect(
      proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "dated_military_throughput")
    ).toMatchObject({ desired: 2, satisfiedActorIds: ["producer"] });
  });
});
