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
import { catalog } from "./ai-macro-test-fixtures";

describe("AI macro opening and gathering", () => {
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
    ).toBe(2);
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
        baseId: `base:${index}` as const,
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
    ).toMatchObject({ desired: 2, satisfiedActorIds: expect.arrayContaining(workers.map((worker) => worker.actorId)) });
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
});
