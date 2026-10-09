import {
  FactionType,
  ObjectNames,
  OrderType,
  ProbableWaffleAiDifficulty
} from "@fuzzy-waddle/probable-waffle-protocol";

import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";

import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";

import { createAiTestObservation, createAiTestOwnedActor } from "../testing/ai-test-fixtures";

import { AiMacroManager } from "./ai-macro-manager";
import { catalog, completedOpeningState } from "./ai-macro-test-fixtures";

describe("AI macro construction commitments", () => {
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
        expect.objectContaining({ purpose: "dated_ground_pressure", desired: 12 }),
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
});
