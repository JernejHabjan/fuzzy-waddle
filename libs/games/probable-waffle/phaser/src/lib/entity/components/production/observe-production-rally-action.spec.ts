import type Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { OrderData } from "../../../ai/OrderData";
import { OrderType } from "../../../ai/order-type";
import { PawnAiBlackboard } from "../../../prefabs/ai-agents/pawn-ai-blackboard";
import { PawnOrderObservation } from "../../../prefabs/ai-agents/pawn-order-observation";
import { productionCaptureItem } from "../../../player/ai-controller/testing/ai-runtime-production-capture-fixtures";
import { observeProductionRallyAction } from "./observe-production-rally-action";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../prefabs/ai-agents/pawn-ai-controller", () => ({ PawnAiController: class {} }));

describe("native selected rally action scope (unrun until final gate)", () => {
  const product = {} as Phaser.GameObjects.GameObject;

  it("makes no controller reads without a listener and preserves the one native false result", () => {
    const producer = { scene: { events: { listenerCount: () => 0 } } } as unknown as Phaser.GameObjects.GameObject;
    jest.mocked(getActorComponent).mockClear(); const call = jest.fn(() => false);
    expect(observeProductionRallyAction(producer, productionCaptureItem(), product, call)).toBe(false);
    expect(call).toHaveBeenCalledTimes(1); expect(getActorComponent).not.toHaveBeenCalled();
  });

  it("retains the original Promise and handles failed diagnostic reads without retrying the action", () => {
    const producer = { scene: { events: { listenerCount: () => 1 } } } as unknown as Phaser.GameObjects.GameObject;
    jest.mocked(getActorComponent).mockImplementationOnce(() => { throw new Error("diagnostic"); });
    const promise = Promise.resolve(false), call = jest.fn(() => promise);
    expect(observeProductionRallyAction(producer, productionCaptureItem(), product, call)).toBe(promise);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("binds exactly the admitted native order to the actual producer/item scope and preserves native errors", () => {
    const producer = { scene: { events: { listenerCount: () => 1 } } } as unknown as Phaser.GameObjects.GameObject;
    const board = new PawnAiBlackboard(), item = productionCaptureItem(), error = new Error("native");
    jest.mocked(getActorComponent).mockReturnValue({ blackboard: board } as never);
    const seen: unknown[] = [];
    const release = PawnOrderObservation.subscribe(board, (_order, origin) => { if (origin) seen.push(origin); });
    const call = jest.fn(() => { board.addOrder(new OrderData(OrderType.Move, {})); throw error; });
    expect(() => observeProductionRallyAction(producer, item, product, call)).toThrow(error);
    expect(call).toHaveBeenCalledTimes(1); expect(seen[0]).toMatchObject({ producer, item }); release();
  });
});
