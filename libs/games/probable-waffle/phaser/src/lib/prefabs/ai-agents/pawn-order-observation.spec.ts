import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PawnOrderObservation } from "./pawn-order-observation";

describe("local native pawn order admission/rally observation (unrun until final gate)", () => {
  const producer = {} as Phaser.GameObjects.GameObject, item = {} as UnifiedQueueItem;

  it("observes the actual successfully enqueued reference and preserves native replacement/cancellation order", () => {
    const board = new PawnAiBlackboard(), order = new OrderData(OrderType.Move, {});
    const events: string[] = [];
    board.addOrder(new OrderData(OrderType.Stop, {}));
    board.cancellationHandler = () => events.push("cancel");
    board.queuedOrderCancellationHandler = () => events.push("queued_cancel");
    const release = PawnOrderObservation.subscribe(board, (actual, origin) => {
      expect(actual).toBe(order); expect(board.peekNextPlayerOrder()).toBe(order);
      events.push(origin ? "rally" : "enqueued");
    });
    const result = PawnOrderObservation.rally(board, producer, item, () => {
      board.overrideOrderQueueAndActiveOrder(order); return "native";
    });
    expect(result).toBe("native"); expect(events).toEqual(["cancel", "queued_cancel", "enqueued", "rally"]);
    release(); board.addOrder(new OrderData(OrderType.Stop, {})); expect(events).toHaveLength(4);
  });

  it("does not attribute ambiguous nested cancellation admissions to rally", () => {
    const board = new PawnAiBlackboard(), observations: boolean[] = [];
    const release = PawnOrderObservation.subscribe(board, (_order, origin) => observations.push(!!origin));
    board.cancellationHandler = () => board.addOrder(new OrderData(OrderType.Stop, {}));
    PawnOrderObservation.rally(board, producer, item, () =>
      board.overrideOrderQueueAndActiveOrder(new OrderData(OrderType.Move, {})));
    expect(observations).toEqual([false, false]); release();
  });

  it("bounds nested rally scopes without reviving attribution below an exhausted scope", () => {
    const board = new PawnAiBlackboard(), origins: unknown[] = [];
    const release = PawnOrderObservation.subscribe(board, (_order, origin) => { if (origin) origins.push(origin); });
    const nested = (remaining: number): void => {
      if (!remaining) { board.addOrder(new OrderData(OrderType.Move, {})); return; }
      PawnOrderObservation.rally(board, producer, item, () => nested(remaining - 1));
    };
    nested(12); expect(origins).toEqual([]);
    nested(1); expect(origins).toHaveLength(1); release();
  });

  it("preserves native errors and releases the transient rally scope even when observers throw", () => {
    const board = new PawnAiBlackboard(), error = new Error("native"), origins: boolean[] = [];
    const releaseFailure = PawnOrderObservation.subscribe(board, () => { throw new Error("diagnostic"); });
    const release = PawnOrderObservation.subscribe(board, (_order, origin) => origins.push(!!origin));
    expect(() => PawnOrderObservation.rally(board, producer, item, () => {
      board.addOrder(new OrderData(OrderType.Move, {})); throw error;
    })).toThrow(error);
    board.addOrder(new OrderData(OrderType.Stop, {}));
    expect(origins).toEqual([false, true, false]); release(); releaseFailure();
  });
});
