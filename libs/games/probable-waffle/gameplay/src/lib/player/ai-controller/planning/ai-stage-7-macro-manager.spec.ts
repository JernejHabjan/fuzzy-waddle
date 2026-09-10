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
import { createStage2Observation, createStage2OwnedActor } from "../testing/ai-stage-2-test-fixtures";
import { AiStage7MacroManagerV1 } from "./ai-stage-7-macro-manager";

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
      constructs: [ObjectNames.Olival, ObjectNames.AnkGuard, ObjectNames.Granary],
      researches: [],
      gathers: [ResourceType.Wood],
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
    }
  ]
};

describe("AiStage7MacroManagerV1", () => {
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
      ...createStage2Observation(),
      actors: [
        {
          ...createStage2OwnedActor("main"),
          objectName: ObjectNames.Sandhold,
          housingCost: { status: "known" as const, value: 0, observedTick: 20 }
        }
      ]
    };
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(observation, state);

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
    const workers = Array.from({ length: 6 }, (_, index) => createStage2OwnedActor(`worker-${index}`));
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(
      { ...createStage2Observation(), actors: workers },
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
    const workers = Array.from({ length: 5 }, (_, index) => createStage2OwnedActor(`worker-${index}`));
    const main = {
      ...createStage2OwnedActor("main"),
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
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(
      { ...createStage2Observation(), actors: [...workers, main] },
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
      ...createStage2OwnedActor("worker-idle"),
      activeOrder: { status: "known", value: null, observedTick: 20 }
    };
    const activeWorker: AiObservedActorV1 = {
      ...createStage2OwnedActor("worker-active"),
      activeOrder: {
        status: "known",
        value: { orderType: OrderType.Gather, targetActorId: "wood-source" },
        observedTick: 20
      }
    };
    const source: AiObservedActorV1 = {
      ...createStage2OwnedActor("wood-source"),
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
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(
      { ...createStage2Observation(), actors: [idleWorker, activeWorker, source] },
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
      ...createStage2Observation(),
      actors: [
        ...Array.from({ length: 6 }, (_, index) => ({
          ...createStage2OwnedActor(`worker-variant-${index}`),
          objectName: ObjectNames.TivaraWorkerFemale
        })),
        { ...createStage2OwnedActor("main"), objectName: ObjectNames.Sandhold }
      ]
    };

    const proposal = new AiStage7MacroManagerV1(() => variantCatalog).propose(observation, state);
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
      ...createStage2Observation(),
      actors: [
        {
          ...createStage2OwnedActor("house"),
          objectName: ObjectNames.Olival,
          housingCapacity: { status: "known" as const, value: 8, observedTick: 20 }
        }
      ]
    };
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(observation, state);

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
      ...createStage2Observation(),
      actors: Array.from({ length: 6 }, (_, index) => createStage2OwnedActor(`worker-${index}`)),
      map: { ...createStage2Observation().map!, constructionCells: cells }
    };

    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(observation, state);
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
    const workers = Array.from({ length: 6 }, (_, index) => createStage2OwnedActor(`worker-${index}`));
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
    const manager = new AiStage7MacroManagerV1(() => catalog);
    const supply = manager.propose(
      {
        ...createStage2Observation(),
        actors: workers,
        map: { ...createStage2Observation().map!, constructionCells: cells }
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
      ...createStage2OwnedActor("house"),
      objectName: ObjectNames.Olival,
      housingCapacity: { status: "known" as const, value: 8, observedTick: 40 }
    };
    const producer = manager.propose(
      {
        ...createStage2Observation(),
        tick: 40,
        actors: [...workers, house],
        map: { ...createStage2Observation().map!, constructionCells: cells }
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
    const workers = Array.from({ length: 6 }, (_, index) => createStage2OwnedActor(`worker-${index}`));
    const constructionSite = {
      ...createStage2OwnedActor("olival-site"),
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
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(
      { ...createStage2Observation(), actors: [...assignedWorkers, constructionSite] },
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
      ...createStage2OwnedActor(`worker-${index}`),
      activeOrder: { status: "known" as const, value: null, observedTick: 20 }
    }));
    const constructionSite = {
      ...createStage2OwnedActor("olival-site"),
      objectName: ObjectNames.Olival,
      constructionProgress: { status: "known" as const, value: 54, observedTick: 20 }
    };
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(
      { ...createStage2Observation(), actors: [...workers, constructionSite] },
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
      ...createStage2OwnedActor(`worker-${index}`),
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
    const proposal = new AiStage7MacroManagerV1(() => catalog).propose(
      {
        ...createStage2Observation(),
        actors: workers,
        map: { ...createStage2Observation().map!, constructionCells: cells }
      },
      state
    );
    const construct = proposal.intents.find((intent) => intent.kind === "construct");

    expect(construct).toEqual(expect.objectContaining({ builderIds: ["worker-1"] }));
  });
});
