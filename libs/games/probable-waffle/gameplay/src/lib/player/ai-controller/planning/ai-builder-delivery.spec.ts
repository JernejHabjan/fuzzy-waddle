import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { createAiTestObservation, createAiTestOwnedActor, unknownAiValue } from "../testing/ai-test-fixtures";
import { AiMacroManager } from "./ai-macro-manager";
import { isAvailableBuilder } from "./ai-macro-observation";
import { catalog, completedOpeningState } from "./ai-macro-test-fixtures";

function carryingWorker(amount: number): AiObservedActorV1 {
  return {
    ...createAiTestOwnedActor("a-carrying"),
    resourceState: {
      status: "known",
      observedTick: 200,
      value: {
        resourceType: ResourceType.Food,
        available: unknownAiValue,
        carried: { status: "known", value: amount, observedTick: 200 },
        growthReadyTick: unknownAiValue,
        serviceCapacity: unknownAiValue
      }
    }
  };
}

describe("AI builder delivery ownership", () => {
  it("keeps ReturnResources owned by delivery even without a known cargo amount", () => {
    expect(
      isAvailableBuilder({
        ...createAiTestOwnedActor("worker"),
        activeOrder: {
          status: "known",
          value: { orderType: OrderType.ReturnResources, targetActorId: "drop-off" },
          observedTick: 200
        }
      })
    ).toBe(false);
  });

  it("keeps a repairing worker assigned to repair instead of borrowing it for construction", () => {
    expect(
      isAvailableBuilder({
        ...createAiTestOwnedActor("repairer"),
        activeOrder: {
          status: "known",
          value: { orderType: OrderType.Repair, targetActorId: "damaged-building" },
          observedTick: 200
        }
      })
    ).toBe(false);
  });

  it.each([1, 5, 10])("preserves %i carried resources while a gather cycle awaits delivery", (amount) => {
    expect(isAvailableBuilder(carryingWorker(amount))).toBe(false);
  });

  it("releases an empty idle worker for construction after delivery", () => {
    expect(isAvailableBuilder(carryingWorker(0))).toBe(true);
  });

  it("waits for delivery without deleting the dated military-capacity deficit", () => {
    const workers = Array.from({ length: 6 }, (_, index) => ({
      ...createAiTestOwnedActor(`worker-${index}`),
      activeOrder: {
        status: "known" as const,
        value: { orderType: OrderType.ReturnResources, targetActorId: "drop-off" },
        observedTick: 200
      }
    }));
    const proposal = new AiMacroManager(() => catalog).propose(
      {
        ...createAiTestObservation(),
        tick: 200,
        actors: [...workers, { ...createAiTestOwnedActor("producer"), objectName: ObjectNames.AnkGuard }]
      },
      completedOpeningState()
    );
    expect(proposal.intents.some((intent) => intent.kind === "construct")).toBe(false);
    expect(proposal.statePatch?.economyProduction?.demands).toContainEqual(
      expect.objectContaining({
        demandId: "demand:capacity:first-army",
        desired: 2,
        satisfiedActorIds: ["producer"]
      })
    );
  });

  it("chooses an empty worker for a real military-capacity proposal instead of stranding partial cargo", () => {
    const input = createAiTestObservation();
    const cells = Array.from({ length: 25 }, (_, index) => ({
      tileKey: `${8 + (index % 5)},${8 + Math.floor(index / 5)}`,
      position: { x: 8 + (index % 5), y: 8 + Math.floor(index / 5), z: 0 },
      groundPassable: true,
      waterPassable: false,
      elevation: 0,
      observedBlocked: false
    }));
    const proposal = new AiMacroManager(() => catalog).propose(
      {
        ...input,
        tick: 200,
        actors: [
          carryingWorker(5),
          ...Array.from({ length: 5 }, (_, index) => createAiTestOwnedActor(`b-worker-${index}`)),
          { ...createAiTestOwnedActor("producer"), objectName: ObjectNames.AnkGuard }
        ],
        map: {
          bounds: { status: "known", value: { width: 32, height: 32 }, observedTick: 200 },
          staticRevision: 1,
          frontierAccessNodeIds: [],
          scoutCoverageAccessNodeIds: [],
          dynamicObstacleActorIds: [],
          regionGeneration: { generation: 1, status: "ready", continuationCursor: 0 },
          constructionCells: cells
        }
      },
      completedOpeningState()
    );
    const capacity = proposal.intents.find(
      (intent) => intent.kind === "construct" && intent.objectName === ObjectNames.AnkGuard
    );
    expect(capacity).toBeDefined();
    if (!capacity || capacity.kind !== "construct") throw new Error("fixture capacity proposal missing");
    expect(capacity.builderIds).toHaveLength(1);
    expect(capacity.builderIds[0]).toMatch(/^b-worker-/);
    expect(
      proposal.intents
        .filter((intent) => intent.kind === "construct")
        .every((intent) => !intent.claims.some((claim) => claim.kind === "actor" && claim.actorId === "a-carrying"))
    ).toBe(true);
  });
});
