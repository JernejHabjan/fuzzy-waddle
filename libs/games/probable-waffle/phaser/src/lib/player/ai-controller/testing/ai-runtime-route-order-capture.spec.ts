import type Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { OrderData } from "../../../ai/OrderData";
import { OrderType } from "../../../ai/order-type";
import { PawnAiBlackboard } from "../../../prefabs/ai-agents/pawn-ai-blackboard";
import { PawnOrderObservation } from "../../../prefabs/ai-agents/pawn-order-observation";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { MovementQueryObservation } from "../../../entity/systems/movement-query-observation";
import { MovementCompletionObservation } from "../../../entity/systems/movement-completion-observation";
import { PawnResourceServiceObservation } from "../../../prefabs/ai-agents/pawn-resource-service-observation";
import { ResourceServiceObservation } from "../../../entity/components/resource/resource-service-observation";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { AiRuntimeRouteOrderCapture } from "./ai-runtime-route-order-capture";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import type { AiRuntimeProductionSpatialV1 } from "./ai-runtime-production-spatial-v1";
import { productionCaptureItem } from "./ai-runtime-production-capture-fixtures";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../prefabs/ai-agents/pawn-ai-controller", () => ({ PawnAiController: class {} }));
jest.mock("./capture-ai-runtime-created-actor", () => ({ captureAiRuntimeCreatedActor: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectCurrentTile: jest.fn() }));

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
  it("threads the native service execution into cargo evidence independently of the later current order", async () => {
    const f = fixture(), owner = {}, order = new OrderData(OrderType.Gather, { targetGameObject: f.producer });
    jest.mocked(getActorComponent).mockImplementation((_actor, component) => component === PawnAiController ?
      { blackboard: f.board } as never : component === GathererComponent ? owner as never : undefined);
    f.board.addOrder(order);
    const promise = Promise.resolve(1);
    const pending = PawnResourceServiceObservation.invoke(f.product, f.board, order, f.producer, "gather", (execution) => {
      f.board.setCurrentOrder(new OrderData(OrderType.Stop));
      const cargo = { amount: 0, resourceType: ResourceType.Wood };
      ResourceServiceObservation.begin(f.product, owner, f.producer, () => ({ ...cargo }), execution);
      ResourceServiceObservation.change(f.product, owner, () => ({ ...cargo }),
        { reason: "added", execution, target: f.producer, resourceType: ResourceType.Wood, delta: 1 }, () => { cargo.amount = 1; });
      return promise;
    });
    expect(pending).toBe(promise); expect(await pending).toBe(1);
    expect(f.records.find((value) => value.kind === "resource_service" && value.phase === "cargo_changed"))
      .toMatchObject({ attemptId: 1, cargoId: 1, lifetimeValid: true, phase: "cargo_changed",
        before: { amount: 0 }, after: { amount: 1 } }); f.capture.dispose();
  });
  it("freezes service order data before native work and fences a pending return across restore", async () => {
    const f = fixture(), order = new OrderData(OrderType.Gather, { targetGameObject: f.producer });
    f.board.addOrder(order); f.board.setCurrentOrder(order);
    let settle: ((amount: number) => void) | undefined;
    const original = new Promise<number>((resolve) => { settle = resolve; });
    const pending = PawnResourceServiceObservation.invoke(f.product, f.board, order, f.producer, "gather", () => original);
    order.orderType = OrderType.ReturnResources; order.data.targetGameObject = f.product;
    f.board.setCurrentOrder(new OrderData(OrderType.Stop));
    f.board.setData({}, f.scene);
    if (!settle) throw new Error("service_capture_pending_missing");
    settle(2); expect(pending).toBe(original); expect(await pending).toBe(2);
    const attempts = f.records.filter((record) => record.kind === "service_attempt");
    expect(attempts).toMatchObject([
      { attemptId: 1, phase: "started", lifetimeValid: true, order: { orderId: 1, orderType: OrderType.Gather } },
      { attemptId: 1, phase: "resolved", amount: 2, lifetimeValid: false,
        order: { orderId: 1, orderType: OrderType.Gather, target: { actorId: "producer" } } }
    ]); f.capture.dispose();
  });

  it("keeps pending service observation partial after capture disposal", async () => {
    const f = fixture(), order = new OrderData(OrderType.ReturnResources, { targetGameObject: f.producer });
    f.board.addOrder(order);
    const promise = Promise.resolve(3);
    const pending = PawnResourceServiceObservation.invoke(f.product, f.board, order, f.producer, "drop_off", () => promise);
    const count = f.records.length; f.capture.dispose();
    expect(await pending).toBe(3); expect(f.records).toHaveLength(count);
    expect(f.records.at(-1)).toMatchObject({ kind: "service_attempt", phase: "started", amount: null });
  });
  it("captures one execution with its retained order across replacement, then fences restore and disposes listeners", () => {
    const f = fixture(), order = new OrderData(OrderType.Move, { targetTileLocation: { x: 8, y: 9, z: 0 } });
    f.board.addOrder(order); f.board.setCurrentOrder(order);
    const context = MovementQueryObservation.capture(f.product, f.board, order, "location_movement");
    const completion = MovementCompletionObservation.begin(context, "path", { x: 8, y: 9 });
    completion?.destination({ x: 8, y: 9 });
    f.board.setCurrentOrder(new OrderData(OrderType.Stop));
    jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 8, y: 9, z: 0 });
    completion?.terminal("arrived");
    const arrival = f.records.find((record) => record.kind === "movement" && record.phase === "arrived");
    expect(arrival).toMatchObject({ executionId: 1, caller: { invocationId: 1, lifetimeValid: true, order: { orderId: 1 } },
      actualTile: { x: 8, y: 9 } });
    f.board.setData({}, f.scene); completion?.returned(true);
    expect(f.records.at(-1)).toMatchObject({ kind: "movement", phase: "returned_true", executionId: 1,
      caller: { invocationId: 1, lifetimeValid: false, order: { orderId: 1 } } });
    const count = f.records.length; f.capture.dispose(); completion?.returned(false);
    expect(f.records).toHaveLength(count);
  });
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

  it("keeps the use-site order across replacement/mutation and fences restore/reuse without rebinding", () => {
    const f = fixture(), tile = { x: 8, y: 9, z: 0 }, order = new OrderData(OrderType.Move, { targetTileLocation: tile });
    f.board.addOrder(order); f.board.setCurrentOrder(order);
    const context = MovementQueryObservation.capture(f.product, f.board, order, "location_movement");
    const active = context ? { context, stage: "initial" as const } : undefined;
    tile.x = 99; f.board.setCurrentOrder(new OrderData(OrderType.Stop));
    expect(f.capture.caller(f.product, active)).toMatchObject({ invocationId: 1, lifetimeValid: true,
      order: { orderId: 1, admissionObserved: true, targetTile: { x: 8, y: 9 } } });
    expect(f.capture.caller(f.product, context ? { context: { ...context }, stage: "initial" } : undefined)).toBeUndefined();
    f.board.setData({}, f.scene);
    expect(f.capture.caller(f.product, active)).toMatchObject({ invocationId: 1, lifetimeValid: false, order: { orderId: 1 } });
    f.capture.unwatchActor(f.product); f.capture.watchActor(f.product);
    expect(f.capture.caller(f.product, active)?.lifetimeValid).toBe(false);
    expect(f.capture.caller(f.producer, active)).toBeUndefined();
    f.capture.dispose(); expect(f.capture.caller(f.product, active)).toBeUndefined();
  });

  it("records unordered container movement explicitly and saturates invocation identities without reviving them", () => {
    const f = fixture();
    let context = MovementQueryObservation.capture(f.product, f.board, null, "boarding_container_shore");
    expect(f.capture.caller(f.product, context ? { context, stage: "initial" } : undefined)).toMatchObject({
      invocationId: 1, order: null, caller: "boarding_container_shore", lifetimeValid: true });
    for (let index = 1; index < 8193; index++) {
      context = MovementQueryObservation.capture(f.product, f.board, null, "boarding_container_shore");
    }
    expect(f.capture.caller(f.product, context ? { context, stage: "fallback" } : undefined)).toBeUndefined();
    f.capture.unwatchActor(f.product); f.capture.watchActor(f.product);
    context = MovementQueryObservation.capture(f.product, f.board, null, "boarding_container_shore");
    expect(f.capture.caller(f.product, context ? { context, stage: "initial" } : undefined)).toBeUndefined();
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
