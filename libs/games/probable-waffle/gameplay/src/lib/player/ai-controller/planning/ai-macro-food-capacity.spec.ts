import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";

import { AiMacroManager } from "./ai-macro-manager";
import { catalog, completedOpeningState } from "./ai-macro-test-fixtures";

describe("AI macro renewable food capacity", () => {
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
      expect.arrayContaining([expect.objectContaining({ purpose: "renewable_food_capacity", desired: 4 })])
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
    const idleWorker = createAiTestOwnedActor("idle-worker");
    const granary = { ...createAiTestOwnedActor("granary"), objectName: ObjectNames.Granary };

    const proposal = new AiMacroManager(() => catalog).propose(
      { ...createAiTestObservation(), tick: 200, actors: [worker, idleWorker, granary, ...fields] },
      state
    );

    expect(
      proposal.intents.some((intent) => intent.kind === "assign_gatherers" && intent.resourceType === ResourceType.Food)
    ).toBe(false);
    expect(
      proposal.statePatch?.economyProduction?.demands.find((demand) => demand.purpose === "renewable_food_capacity")
    ).toMatchObject({ desired: 1 });
  });

  it("does not assign an idle worker to a resource source whose service capacity is full", () => {
    const gatheringWorker = {
      ...createAiTestOwnedActor("gathering-worker"),
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.Gather, targetActorId: "wood-source" },
        observedTick: 200
      }
    };
    const woodSource = {
      ...createAiTestOwnedActor("wood-source"),
      relation: "neutral" as const,
      visibility: "visible" as const,
      resourceState: {
        status: "known" as const,
        value: {
          resourceType: ResourceType.Wood,
          available: { status: "known" as const, value: 100, observedTick: 200 },
          carried: unknownAiValue,
          growthReadyTick: unknownAiValue,
          serviceCapacity: { status: "known" as const, value: 1, observedTick: 200 }
        },
        observedTick: 200
      }
    };
    const proposal = new AiMacroManager(() => catalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        actors: [gatheringWorker, createAiTestOwnedActor("idle-worker"), woodSource]
      },
      completedOpeningState()
    );

    expect(
      proposal.intents.some((intent) => intent.kind === "assign_gatherers" && intent.sourceActorId === "wood-source")
    ).toBe(false);
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
});
