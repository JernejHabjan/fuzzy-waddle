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
      actors: Array.from({ length: 6 }, (_, index) => ({
        ...createStage2OwnedActor(`worker-variant-${index}`),
        objectName: ObjectNames.TivaraWorkerFemale
      }))
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
});
