import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { MovementQueryObservation } from "../../entity/systems/movement-query-observation";
import { PawnResourceServiceObservation } from "./pawn-resource-service-observation";
import type { PawnResourceServiceEvent } from "./pawn-resource-service-event";
import type Phaser from "phaser";
import { State } from "mistreevous";
import { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { getActorComponent } from "../../data/actor-component";
import { getActorSystem } from "../../data/actor-system";
import { MovementSystem } from "../../entity/systems/movement.system";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import { ContainableComponent } from "../../entity/components/building/containable-component";
import { ContainerComponent } from "../../entity/components/building/container-component";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/actor-system", () => ({ getActorSystem: jest.fn() }));

/** Native boundary doubles supply no navigation, arrival or useful-effect evidence. */
function fixture() {
  const scene = { sys: { isActive: () => true } } as unknown as Phaser.Scene;
  const actor = { scene } as Phaser.GameObjects.GameObject;
  const target = { scene } as Phaser.GameObjects.GameObject;
  const blackboard = new PawnAiBlackboard();
  const agent = new PlayerPawnAiControllerAgent(actor, blackboard);
  return { actor, target, blackboard, agent };
}

describe("pawn agent native order boundaries", () => {
  beforeEach(() => jest.resetAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("constructs without component/system reads and selects the exact queued order", () => {
    const f = fixture();
    expect(getActorComponent).not.toHaveBeenCalled();
    expect(getActorSystem).not.toHaveBeenCalled();
    expect(f.agent.AssignNextOrderFromQueue()).toBe(State.FAILED);
    const cancel = jest.fn();
    jest
      .mocked(getActorComponent)
      .mockImplementation((_actor, token) =>
        token === ContainableComponent ? ({ cancelAnyPendingBoardingRequest: cancel } as never) : undefined
      );
    const order = new OrderData(OrderType.Move, { targetGameObject: f.target });
    f.blackboard.addOrder(order);
    expect(f.agent.AssignNextOrderFromQueue()).toBe(State.SUCCEEDED);
    expect(f.blackboard.getCurrentOrder()).toBe(order);
    expect(f.blackboard.peekNextPlayerOrder()).toBe(order);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("keeps the original movement target across a pending reachability probe", async () => {
    const f = fixture();
    const order = new OrderData(OrderType.Move, { targetGameObject: f.target });
    f.blackboard.setCurrentOrder(order);
    let release: ((value: boolean) => void) | undefined;
    const canMoveTo = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          release = resolve;
        })
    );
    const move = jest.fn(async (_target: Phaser.GameObjects.GameObject) => true);
    jest
      .mocked(getActorSystem)
      .mockImplementation((_actor, token) =>
        token === MovementSystem ? ({ canMoveTo, moveToActorByAdjustingPathDynamically: move } as never) : undefined
      );
    const contexts: unknown[] = [];
    const unsubscribe = MovementQueryObservation.subscribe(f.blackboard, (context) => {
      contexts.push(context);
    });
    const pending = f.agent.MoveToTarget("move");
    expect(canMoveTo).toHaveBeenCalledWith(f.target, 0, requireAiTestEntry(contexts, 0));
    const replacement = new OrderData(OrderType.Move, { targetTileLocation: { x: 9, y: 9, z: 0 } });
    f.blackboard.setCurrentOrder(replacement);
    if (!release) throw new Error("pawn_test_probe_missing");
    release(true);
    expect(await pending).toBe(State.SUCCEEDED);
    expect(requireAiTestEntry(move.mock.calls, 0)?.[0]).toBe(f.target);
    expect(f.blackboard.getCurrentOrder()).toBe(replacement);
    expect(order.data.targetGameObject).toBe(f.target);
    expect(contexts).toMatchObject([
      { caller: "reachability_probe", order },
      { caller: "actor_movement", order }
    ]);
    expect(move).toHaveBeenCalledWith(f.target, expect.any(Object), requireAiTestEntry(contexts, 1));
    unsubscribe();
  });

  it("does not move after a denied probe and preserves the caught probe-error result", async () => {
    const f = fixture();
    f.blackboard.setCurrentOrder(new OrderData(OrderType.Move, { targetGameObject: f.target }));
    const canMoveTo = jest.fn(async () => false),
      move = jest.fn();
    jest.mocked(getActorSystem).mockReturnValue({ canMoveTo, moveToActorByAdjustingPathDynamically: move } as never);
    expect(await f.agent.MoveToTarget("move")).toBe(State.FAILED);
    expect(move).not.toHaveBeenCalled();
    const error = new Error("native probe rejected");
    canMoveTo.mockRejectedValue(error);
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await f.agent.MoveToTarget("move")).toBe(State.FAILED);
    expect(log).toHaveBeenCalledWith("[Build] MoveToTarget: Error", error);
    expect(move).not.toHaveBeenCalled();
  });

  it("resource acquisition mutates the order read after the native lookup finishes", async () => {
    const f = fixture(),
      earlier = new OrderData(OrderType.Gather),
      later = new OrderData(OrderType.Gather);
    f.blackboard.setCurrentOrder(earlier);
    let release: ((target: Phaser.GameObjects.GameObject) => void) | undefined;
    const drain = jest.fn(
      () =>
        new Promise<Phaser.GameObjects.GameObject>((resolve) => {
          release = resolve;
        })
    );
    jest
      .mocked(getActorComponent)
      .mockImplementation((_actor, token) =>
        token === GathererComponent ? ({ getPreferredResourceDrain: drain } as never) : undefined
      );
    const pending = f.agent.AcquireNewResourceDrain();
    f.blackboard.setCurrentOrder(later);
    if (!release) throw new Error("pawn_test_drain_missing");
    release(f.target);
    expect(await pending).toBe(State.SUCCEEDED);
    expect(earlier.data.targetGameObject).toBeUndefined();
    expect(later.data.targetGameObject).toBe(f.target);
    expect(drain).toHaveBeenCalledTimes(1);
  });

  it("gathering keeps its earlier order while the range action awaits", async () => {
    const f = fixture(),
      earlier = new OrderData(OrderType.Gather, { targetGameObject: f.target });
    const later = new OrderData(OrderType.Stop);
    f.blackboard.setCurrentOrder(earlier);
    let release: ((state: State) => void) | undefined;
    jest.spyOn(f.agent, "InRange").mockImplementation(
      () =>
        new Promise<State>((resolve) => {
          release = resolve;
        })
    );
    const gatherer = {
      remainingCooldown: 0,
      isCapacityFull: () => false,
      startGatheringResources: jest.fn(() => true),
      gatherResources: jest.fn(async () => 2)
    };
    const events: PawnResourceServiceEvent[] = [];
    const unsubscribe = PawnResourceServiceObservation.subscribe(f.blackboard, (event) => events.push(event));
    // Missing health retains native permissive behavior; resource admission still uses the source component.
    jest
      .mocked(getActorComponent)
      .mockImplementation((_actor, token) =>
        token === GathererComponent
          ? (gatherer as never)
          : token === ResourceSourceComponent
            ? ({ getCurrentResources: () => 1 } as never)
            : undefined
      );
    const pending = f.agent.GatherResource();
    f.blackboard.setCurrentOrder(later);
    if (!release) throw new Error("pawn_test_range_missing");
    release(State.SUCCEEDED);
    expect(await pending).toBe(State.SUCCEEDED);
    expect(gatherer.startGatheringResources).toHaveBeenCalledWith(f.target);
    expect(gatherer.gatherResources).toHaveBeenCalledWith(f.target, requireAiTestEntry(events, 0).execution);
    expect(f.blackboard.getCurrentOrder()).toBe(later);
    expect(events).toMatchObject([
      { phase: "started", operation: "gather", order: earlier, target: f.target },
      { phase: "resolved", operation: "gather", order: earlier, target: f.target, amount: 2 }
    ]);
    unsubscribe();
  });

  it("the detached Stop callback keeps boarding cleanup before reset and queue pop", () => {
    const f = fixture(),
      order = new OrderData(OrderType.EnterContainer, { targetGameObject: f.target });
    f.blackboard.addOrder(order);
    f.blackboard.setCurrentOrder(order);
    const events: string[] = [];
    jest.mocked(getActorComponent).mockImplementation((_actor, token) =>
      token === ContainerComponent
        ? ({
            cancelBoardingRequest: jest.fn(() => {
              events.push("cancel");
            })
          } as never)
        : undefined
    );
    f.blackboard.currentOrderChanged.subscribe(() => {
      events.push("reset");
    });
    const pop = jest.spyOn(f.blackboard, "popCurrentOrderFromQueue");
    const stop = f.agent.Stop;
    expect(stop("order cancelled by replacement")).toBe(State.SUCCEEDED);
    expect(events).toEqual(["cancel", "reset"]);
    expect(pop).toHaveBeenCalledTimes(1);
    expect(f.blackboard.getCurrentOrder()).toBeUndefined();
    expect(f.blackboard.anyOrderInQueue()).toBe(false);
  });

  it("retains the moved-to-shore boarding request until the boat can load the passenger", () => {
    const f = fixture(),
      order = new OrderData(OrderType.EnterContainer, { targetGameObject: f.target });
    f.blackboard.addOrder(order);
    f.blackboard.setCurrentOrder(order);
    const cancel = jest.fn();
    jest
      .mocked(getActorComponent)
      .mockImplementation((_actor, token) =>
        token === ContainerComponent ? ({ cancelBoardingRequest: cancel } as never) : undefined
      );
    expect(f.agent.Stop("EnterContainer:MovedToShore")).toBe(State.SUCCEEDED);
    expect(cancel).not.toHaveBeenCalled();
    expect(f.blackboard.anyOrderInQueue()).toBe(false);
  });
});
