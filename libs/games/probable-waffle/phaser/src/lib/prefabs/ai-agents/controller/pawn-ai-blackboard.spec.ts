import { OrderType } from "../../../ai/order-type";
import { OrderData } from "../../../ai/OrderData";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";

describe("PawnAiBlackboard", () => {
  it("reports queued orders discarded before they become active", () => {
    const blackboard = new PawnAiBlackboard();
    const queued = new OrderData(OrderType.Move);
    const replacement = new OrderData(OrderType.Attack);
    const discarded: OrderData[][] = [];
    blackboard.queuedOrderCancellationHandler = (orders) => discarded.push([...orders]);
    blackboard.addOrder(queued);

    blackboard.overrideOrderQueueAndActiveOrder(replacement);

    expect(discarded).toEqual([[queued]]);
    expect(blackboard.peekNextPlayerOrder()).toBe(replacement);
  });

  it("does not report the active order twice when replacing it", () => {
    const blackboard = new PawnAiBlackboard();
    const active = new OrderData(OrderType.Move);
    const replacement = new OrderData(OrderType.Attack);
    const discarded: OrderData[][] = [];
    blackboard.queuedOrderCancellationHandler = (orders) => discarded.push([...orders]);
    blackboard.addOrder(active);
    blackboard.setCurrentOrder(active);

    blackboard.overrideOrderQueueAndActiveOrder(replacement);

    expect(discarded).toEqual([]);
  });

  it("persists a released pursuit across native order restoration", () => {
    const original = new OrderData(OrderType.Attack, {
      targetTileLocation: { x: 8, y: 4, z: 0 },
      pursuitReleasedTargetActorId: "fleeing-worker"
    });
    const record = OrderData.mapFromOrderDataClassToRecord(original);
    const restored = OrderData.mapFromRecordToOrderDataClass(record, {} as never);

    expect(restored.data).toMatchObject({
      targetTileLocation: { x: 8, y: 4, z: 0 },
      pursuitReleasedTargetActorId: "fleeing-worker"
    });
  });
});
