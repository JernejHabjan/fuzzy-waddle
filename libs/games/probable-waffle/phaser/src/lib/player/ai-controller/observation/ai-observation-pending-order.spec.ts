import type Phaser from "phaser";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { PawnAiBlackboard } from "../../../prefabs/ai-agents/pawn-ai-blackboard";
import { OrderData } from "../../../ai/OrderData";
import type { AiAccessGraphAdapter } from "./ai-access-graph.adapter";
import { projectAiObservedActor } from "./ai-observation-actor-projector";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { VisionComponent } from "../../../entity/components/vision-component";
import { productionCaptureItem } from "../testing/ai-runtime-production-capture-fixtures";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/actor-level-utils", () => ({ getResearchedLevelForActor: () => 1 }));
jest.mock("../../../data/game-object-helper", () => ({
  getGameObjectLogicalTransform: () => undefined,
  getGameObjectCurrentTile: () => undefined
}));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({
  getPwActorDefinition: jest.fn(() => undefined)
}));
jest.mock("../../../prefabs/ai-agents/pawn-ai-controller", () => ({ PawnAiController: class {} }));
jest.mock("./ai-observation-catalog", () => ({ projectActorCapabilities: () => [] }));
jest.mock("./ai-observation-combat-profile", () => ({ projectAiCombatProfile: () => undefined }));

it("projects queued intake before activation, clears it after removal and keeps opponents' queued orders private", () => {
  const board = new PawnAiBlackboard();
  const actor = { name: "TivaraMacemanMale" } as Phaser.GameObjects.GameObject;
  const access = { resolveNodeId: () => undefined } as unknown as AiAccessGraphAdapter;
  const item = productionCaptureItem();
  item.commandContext = {
    execution: {
      schemaVersion: 1,
      commandId: "queue-command",
      commitmentKey: "queue:head",
      source: "ai",
      authorityEpoch: 0,
      sequence: 1,
      intentId: "intent:head",
      effectId: "composition:effect:head"
    },
    playerNumber: 1,
    actorIds: ["unit"]
  };
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, component) =>
      component === PawnAiController
        ? ({ blackboard: board } as never)
        : component === QueueComponent
          ? ({ allItems: [item], queueDefinition: { queueCount: 1, capacityPerQueue: 5 } } as never)
          : component === OwnerComponent
            ? ({ getOwner: () => 1 } as never)
            : undefined
    );
  const project = (owned = true) =>
    projectAiObservedActor(actor, "unit", owned ? "self" : "enemy", owned ? "owned" : "visible", 20, owned, access);
  board.addOrder(new OrderData(OrderType.Move, { targetGameObjectId: "rally" }));
  expect(project()).toMatchObject({
    activeOrder: { status: "known", value: null },
    pendingOrder: { status: "known", value: { orderType: OrderType.Move, targetActorId: "rally" } }
  });
  expect(project().queue).toMatchObject({
    status: "known",
    value: {
      items: [{ effectId: item.commandContext?.execution.effectId }]
    }
  });
  const peek = jest.spyOn(board, "peekNextPlayerOrder");
  expect(project(false).pendingOrder).toEqual({ status: "unknown", reason: "not_observed" });
  expect(project(false).queue.status).toBe("unknown");
  expect(peek).not.toHaveBeenCalled();
  item.commandContext.playerNumber = 2;
  expect(project().queue).toMatchObject({
    status: "known",
    value: {
      items: [
        expect.not.objectContaining({
          effectId: "composition:effect:head"
        })
      ]
    }
  });
  board.pullNextPlayerOrder();
  expect(project().pendingOrder).toEqual({ status: "known", observedTick: 20, value: null });

  board.setCurrentOrder(new OrderData(OrderType.Move, { targetTileLocation: { x: 8, y: 9, z: 0 } }));
  expect(project().activeOrder).toEqual({
    status: "known",
    observedTick: 20,
    value: { orderType: OrderType.Move, targetActorId: null, targetPosition: { x: 8, y: 9, z: 0 } }
  });
});

it("projects main-building identity for visible enemy actors but not remembered contacts", () => {
  const actor = { name: "Sandhold" } as Phaser.GameObjects.GameObject;
  const access = { resolveNodeId: () => undefined } as unknown as AiAccessGraphAdapter;
  jest.mocked(getPwActorDefinition).mockReturnValue({ meta: { isMainBuilding: true } } as never);
  jest.mocked(getActorComponent).mockImplementation((_actor, component) =>
    component === OwnerComponent ? ({ getOwner: () => 2 } as never) : undefined
  );

  const visible = projectAiObservedActor(actor, "enemy-core", "enemy", "visible", 20, false, access);
  const remembered = projectAiObservedActor(actor, "enemy-core", "enemy", "last_seen", 40, false, access);

  expect(visible.mainBuilding).toEqual({ status: "known", value: true, observedTick: 20 });
  expect(remembered).not.toHaveProperty("mainBuilding");
});

it("projects exact visible enemies from each owned actor's vision source", () => {
  const enemy = { name: "TivaraMacemanMale" } as Phaser.GameObjects.GameObject;
  jest.mocked(getActorComponent).mockImplementation((_actor, component) => {
    if (component === OwnerComponent) return { getOwner: () => 1 } as never;
    if (component === VisionComponent) return { getVisibleEnemies: () => [enemy] } as never;
    if (component === IdComponent) {
      return _actor === enemy ? { id: "visible-enemy" } as never : undefined;
    }
    return undefined;
  });
  const actor = { name: "TivaraMacemanMale" } as Phaser.GameObjects.GameObject;
  const access = { resolveNodeId: () => undefined } as unknown as AiAccessGraphAdapter;

  expect(projectAiObservedActor(actor, "guard", "self", "owned", 20, true, access).visibleEnemyActorIds).toEqual([
    "visible-enemy"
  ]);
  expect(
    projectAiObservedActor(enemy, "enemy", "enemy", "visible", 20, false, access)
  ).not.toHaveProperty("visibleEnemyActorIds");
});
