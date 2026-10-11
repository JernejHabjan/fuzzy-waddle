import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import type Phaser from "phaser";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PawnResourceServiceObservation } from "./pawn-resource-service-observation";
import type { PawnResourceServiceEvent } from "./pawn-resource-service-event";

function fixture() {
  const actor = {} as Phaser.GameObjects.GameObject,
    target = {} as Phaser.GameObjects.GameObject;
  const board = new PawnAiBlackboard(),
    order = new OrderData(OrderType.Gather, { targetGameObject: target });
  return { actor, target, board, order };
}

describe("native resource service observation", () => {
  it("forwards the same Promise and calls once without a listener", async () => {
    const f = fixture(),
      promise = Promise.resolve(0),
      call = jest.fn(() => promise);
    expect(PawnResourceServiceObservation.invoke(f.actor, f.board, f.order, f.target, "gather", call)).toBe(promise);
    expect(call).toHaveBeenCalledTimes(1);
    await promise;
  });

  it("retains exact caller/target across current-order replacement and preserves zero result", async () => {
    const f = fixture(),
      events: PawnResourceServiceEvent[] = [];
    const release = PawnResourceServiceObservation.subscribe(f.board, (event) => events.push(event));
    let settle: ((amount: number) => void) | undefined;
    const promise = new Promise<number>((resolve) => {
      settle = resolve;
    });
    const actual = PawnResourceServiceObservation.invoke(
      f.actor,
      f.board,
      f.order,
      f.target,
      "drop_off",
      () => promise
    );
    f.board.setCurrentOrder(new OrderData(OrderType.Stop));
    if (!settle) throw new Error("service_test_pending_missing");
    settle(0);
    expect(actual).toBe(promise);
    expect(await actual).toBe(0);
    expect(events).toMatchObject([
      { phase: "started", order: f.order, target: f.target, amount: null },
      { phase: "resolved", order: f.order, target: f.target, amount: 0 }
    ]);
    expect(requireAiTestEntry(events, 0).execution).toBe(requireAiTestEntry(events, 1).execution);
    release();
  });

  it("preserves synchronous throws and rejection identity despite observer errors", async () => {
    const f = fixture(),
      events: PawnResourceServiceEvent[] = [],
      error = new Error("native_service");
    const broken = PawnResourceServiceObservation.subscribe(f.board, () => {
      throw new Error("observer");
    });
    const release = PawnResourceServiceObservation.subscribe(f.board, (event) => events.push(event));
    expect(() =>
      PawnResourceServiceObservation.invoke(f.actor, f.board, f.order, f.target, "gather", () => {
        throw error;
      })
    ).toThrow(error);
    const promise = Promise.reject<number>(error);
    expect(PawnResourceServiceObservation.invoke(f.actor, f.board, f.order, f.target, "drop_off", () => promise)).toBe(
      promise
    );
    await expect(promise).rejects.toBe(error);
    expect(events.map((event) => event.phase)).toEqual(["started", "threw", "started", "rejected"]);
    broken();
    release();
  });

  it("drops late terminals after disposal and does not transfer them to a new subscription", async () => {
    const f = fixture(),
      old = jest.fn(),
      later = jest.fn();
    const release = PawnResourceServiceObservation.subscribe(f.board, old);
    const promise = Promise.resolve(3);
    PawnResourceServiceObservation.invoke(f.actor, f.board, f.order, f.target, "gather", () => promise);
    release();
    const releaseLater = PawnResourceServiceObservation.subscribe(f.board, later);
    await promise;
    expect(old).toHaveBeenCalledTimes(1);
    expect(later).not.toHaveBeenCalled();
    releaseLater();
  });

  it("bounds subscriptions without changing the service result for a rejected ninth observer", async () => {
    const f = fixture(),
      ninth = jest.fn(),
      accepted = jest.fn();
    const releases = Array.from({ length: 8 }, () =>
      PawnResourceServiceObservation.subscribe(f.board, (event) => accepted(event))
    );
    releases.push(PawnResourceServiceObservation.subscribe(f.board, ninth));
    const promise = Promise.resolve(4);
    expect(PawnResourceServiceObservation.invoke(f.actor, f.board, f.order, f.target, "gather", () => promise)).toBe(
      promise
    );
    expect(await promise).toBe(4);
    expect(accepted).toHaveBeenCalledTimes(16);
    expect(ninth).not.toHaveBeenCalled();
    releases.forEach((release) => release());
  });
});
