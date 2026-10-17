import type Phaser from "phaser";
import { PawnAiBlackboard } from "../../prefabs/ai-agents/pawn-ai-blackboard";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { MovementQueryObservation } from "./movement-query-observation";

describe("native movement caller observation (unrun until final gate)", () => {
  it("returns the original Promise once and releases the binding before asynchronous continuation", async () => {
    const actor = {} as Phaser.GameObjects.GameObject, board = new PawnAiBlackboard();
    const observer = jest.fn(), release = MovementQueryObservation.subscribe(board, observer);
    const order = new OrderData(OrderType.Move);
    const context = MovementQueryObservation.capture(actor, board, order, "actor_movement");
    const continuation = jest.fn(() => MovementQueryObservation.current(actor));
    const promise = Promise.resolve(true).then(continuation);
    const call = jest.fn(() => {
      expect(MovementQueryObservation.current(actor)).toEqual({ context, stage: "initial" }); return promise;
    });
    expect(MovementQueryObservation.invoke(actor, context, "initial", call)).toBe(promise);
    expect(call).toHaveBeenCalledTimes(1); expect(observer).toHaveBeenCalledWith(context);
    expect(MovementQueryObservation.current(actor)).toBeUndefined();
    await promise; expect(continuation).toHaveReturnedWith(undefined); release();
  });

  it("shadows unrelated nested calls, restores an outer binding after throws, and cannot cross actors", () => {
    const actor = {} as Phaser.GameObjects.GameObject, other = {} as Phaser.GameObjects.GameObject;
    const board = new PawnAiBlackboard(), release = MovementQueryObservation.subscribe(board, () => undefined);
    const context = MovementQueryObservation.capture(actor, board, null, "boarding_container_shore");
    const error = new Error("native query");
    MovementQueryObservation.invoke(actor, context, "repath", () => {
      expect(() => MovementQueryObservation.invoke(actor, undefined, "initial", () => {
        expect(MovementQueryObservation.current(actor)).toBeUndefined(); throw error;
      })).toThrow(error);
      expect(MovementQueryObservation.current(actor)).toEqual({ context, stage: "repath" });
      MovementQueryObservation.invoke(other, context, "initial", () => {
        expect(MovementQueryObservation.current(other)).toBeUndefined();
      });
      expect(MovementQueryObservation.take(actor)).toEqual({ context, stage: "repath" });
      expect(MovementQueryObservation.take(actor)).toBeUndefined();
      expect(MovementQueryObservation.current(actor)).toBeUndefined();
    });
    expect(MovementQueryObservation.current(actor)).toBeUndefined(); release();
  });

  it("caps synchronous nesting and subscribers, fences observer errors, and skips listener-free capture", () => {
    const actor = {} as Phaser.GameObjects.GameObject, board = new PawnAiBlackboard();
    expect(MovementQueryObservation.capture(actor, board, null, "range_probe")).toBeUndefined();
    const releases = Array.from({ length: 8 }, () => MovementQueryObservation.subscribe(board, () => { throw new Error("lost"); }));
    const overflow = jest.fn(), releaseOverflow = MovementQueryObservation.subscribe(board, overflow);
    const context = MovementQueryObservation.capture(actor, board, null, "range_probe");
    const nested = (depth: number): void => {
      MovementQueryObservation.invoke(actor, context, "initial", () => {
        if (depth === 9) expect(MovementQueryObservation.current(actor)).toBeUndefined();
        else { expect(MovementQueryObservation.current(actor)?.context).toBe(context); nested(depth + 1); }
      });
    };
    nested(1); expect(overflow).not.toHaveBeenCalled();
    releases.forEach((release) => release()); releaseOverflow();
    expect(MovementQueryObservation.capture(actor, board, null, "range_probe")).toBeUndefined();
  });
});
