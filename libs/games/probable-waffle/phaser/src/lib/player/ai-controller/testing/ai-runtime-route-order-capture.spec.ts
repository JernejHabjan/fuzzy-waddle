import type Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { OrderData } from "../../../ai/OrderData";
import { OrderType } from "../../../ai/order-type";
import { PawnAiBlackboard } from "../../../prefabs/ai-agents/pawn-ai-blackboard";
import { PawnOrderObservation } from "../../../prefabs/ai-agents/pawn-order-observation";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { AiRuntimeRouteOrderCapture } from "./ai-runtime-route-order-capture";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { productionCaptureItem } from "./ai-runtime-production-capture-fixtures";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../prefabs/ai-agents/pawn-ai-controller", () => ({ PawnAiController: class {} }));
jest.mock("./capture-ai-runtime-created-actor", () => ({ captureAiRuntimeCreatedActor: jest.fn() }));

function fixture() {
  const scene = {} as Phaser.Scene, board = new PawnAiBlackboard();
  const product = { scene, name: ObjectNames.TivaraWorker } as Phaser.GameObjects.GameObject;
  const producer = { scene, name: ObjectNames.TivaraSandhold } as Phaser.GameObjects.GameObject;
  jest.mocked(getActorComponent).mockImplementation((_actor, component) => component === PawnAiController ? { blackboard: board } as never :
    undefined);
  jest.mocked(captureAiRuntimeCreatedActor).mockImplementation((actor) => ({ actorId: actor === producer ? "producer" : "product",
    objectName: actor.name, canonicalObjectName: actor.name, playerNumber: 1, active: true, alive: true, finished: true, indexed: true }));
  const records: AiRuntimeProductionSpatialV1[] = [], item = productionCaptureItem();
  const capture = new AiRuntimeRouteOrderCapture(scene,
    () => ({ clockTick: 10, sceneActive: true, snapshotRestoreInProgress: false }), (_owner, value) => records.push(value));
  capture.bindOutput({ kind: "output", producer, product, item, rallyMode: "tile_action", target: null,
    targetTile: { x: 8, y: 9, z: 0 } }, 1);
  return { board, scene, producer, product, records, capture, item };
}

describe("marked capture order identities (unrun until final gate)", () => {
  it("retains exact admission/rally identity and detached mutable order data without attributing a caller", () => {
    const f = fixture(), tile = { x: 8, y: 9, z: 0 }, order = new OrderData(OrderType.Move, { targetTileLocation: tile });
    PawnOrderObservation.rally(f.board, f.producer, f.item, () => f.board.overrideOrderQueueAndActiveOrder(order));
    f.board.setCurrentOrder(order);
    expect(f.records).toMatchObject([{ kind: "route_order", order: { orderId: 1, originOutputId: null, admissionObserved: true } },
      { kind: "route_rally_order", orderId: 1, outputId: 1 }]);
    expect(f.capture.sample(f.product)).toMatchObject({ orderId: 1, originOutputId: 1, commandContext: null });
    tile.x = 99;
    expect(f.records[0].kind === "route_order" && f.records[0].order.targetTile?.x).toBe(8);
    expect(f.capture.sample(f.product)?.targetTile?.x).toBe(99); f.capture.dispose();
  });

  it("fences partial setData and unregistration/re-registration even when the same OrderData survives", () => {
    const f = fixture(), order = new OrderData(OrderType.Move, {});
    f.board.addOrder(order); f.board.setCurrentOrder(order); const original = f.board.setData;
    f.board.setData({}, f.scene);
    expect(f.capture.sample(f.product)).toMatchObject({ orderId: 2, admissionObserved: false, originOutputId: null });
    expect(f.records[1]).toMatchObject({ kind: "route_order_restore" });
    f.capture.unwatchActor(f.product); f.capture.watchActor(f.product);
    expect(f.capture.sample(f.product)).toMatchObject({ orderId: 3, admissionObserved: false });
    expect(f.board.setData).not.toBe(original); f.capture.dispose(); expect(f.capture.sample(f.product)).toBeUndefined();
  });

  it("preserves a later method owner and unsubscribes after disposal", () => {
    const f = fixture(), replacement = jest.fn(); f.board.setData = replacement;
    f.capture.dispose(); expect(f.board.setData).toBe(replacement);
    f.board.addOrder(new OrderData(OrderType.Move, {})); expect(f.records).toEqual([]);
  });

  it("preserves a failed native restore and restores the original method descriptor on disposal", () => {
    const f = fixture(), error = new Error("native_restore");
    const original = PawnAiBlackboard.prototype.setData;
    // Reinstall around an actual instance mutator that fails after capture has fenced the attempt.
    f.capture.unwatchActor(f.product);
    f.board.setData = () => { throw error; };
    const descriptor = Object.getOwnPropertyDescriptor(f.board, "setData");
    f.capture.watchActor(f.product);
    const order = new OrderData(OrderType.Move, {}); f.board.addOrder(order); f.board.setCurrentOrder(order);
    expect(() => f.board.setData({}, f.scene)).toThrow(error);
    expect(f.capture.sample(f.product)).toMatchObject({ orderId: 2, admissionObserved: false });
    f.capture.dispose(); expect(Object.getOwnPropertyDescriptor(f.board, "setData")).toEqual(descriptor);
    f.board.setData = original;
  });

  it("releases the subscription if an instance cannot accept the passive restore wrapper", () => {
    const f = fixture(); f.capture.unwatchActor(f.product);
    Object.defineProperty(f.board, "setData", { value: f.board.setData, configurable: false, writable: false });
    f.capture.watchActor(f.product);
    expect(f.capture.sample(f.product)).toBeUndefined();
    f.board.addOrder(new OrderData(OrderType.Move, {})); expect(f.records).toEqual([]); f.capture.dispose();
  });

  it("detects a replaced controller and fences the old board without inheriting its admission", () => {
    const f = fixture(), order = new OrderData(OrderType.Move, {});
    f.board.addOrder(order); f.board.setCurrentOrder(order);
    const replacement = new PawnAiBlackboard(); replacement.setCurrentOrder(order);
    jest.mocked(getActorComponent).mockReturnValue({ blackboard: replacement } as never);
    expect(f.capture.sample(f.product)).toMatchObject({ orderId: 2, admissionObserved: false, originOutputId: null });
    expect(f.records[1]).toMatchObject({ kind: "route_order_restore", reason: "controller_replaced" });
    f.board.addOrder(new OrderData(OrderType.Stop, {})); expect(f.records).toHaveLength(2);
    f.capture.dispose();
  });

  it("saturates new order identities while leaving the native queue mutation unchanged", () => {
    const f = fixture(); let last = new OrderData(OrderType.Move, {});
    for (let index = 0; index < 8193; index++) { last = new OrderData(OrderType.Move, {}); f.board.addOrder(last); }
    f.board.setCurrentOrder(last);
    expect(f.records).toHaveLength(8192); expect(f.board.getQueuedOrders()).toHaveLength(8193);
    expect(f.capture.sample(f.product)).toBeUndefined(); f.capture.dispose();
  });

  it("leaves missing controllers, oversized contexts and unobserved old orders explicitly unavailable", () => {
    const f = fixture(), order = new OrderData(OrderType.Move, {}); f.board.setCurrentOrder(order);
    expect(f.capture.sample(f.product)).toMatchObject({ orderId: 1, admissionObserved: false });
    order.data.commandContext = { playerNumber: 1, actorIds: Array.from({ length: 257 }, (_, index) => `actor:${index}`),
      execution: { schemaVersion: 1, commandId: "command", commitmentKey: "key", source: "human", authorityEpoch: 0, sequence: 1 } };
    expect(f.capture.sample(f.product)).toBeUndefined();
    f.capture.unwatchActor(f.product); jest.mocked(getActorComponent).mockReturnValue(undefined);
    expect(f.capture.sample(f.product)).toBeUndefined(); f.capture.dispose();
  });
});
