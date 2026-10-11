import Phaser from "phaser";
import { State } from "mistreevous";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { getActorComponent } from "../../data/actor-component";
import { getActorSystem } from "../../data/actor-system";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PawnAgentMovement } from "./pawn-agent-movement";
import { PawnAgentOrders } from "./pawn-agent-orders";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/actor-system", () => ({ getActorSystem: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture(orderType = OrderType.Move) {
  const scene = { sys: { isActive: () => true, queueDepthSort: () => undefined } } as unknown as Phaser.Scene;
  const actor = new Phaser.GameObjects.GameObject(scene, "fixture");
  const board = new PawnAiBlackboard();
  const order = new OrderData(orderType, {
    targetTileLocation: { x: 25, y: 28, z: 0 },
    commandContext: {
      playerNumber: 2,
      actorIds: ["pawn"],
      execution: {
        schemaVersion: 1,
        source: "ai",
        commandId: "command",
        commitmentKey: "move",
        authorityEpoch: 0,
        sequence: 1
      }
    }
  });
  board.addOrder(order);
  board.setCurrentOrder(order);
  const orders = new PawnAgentOrders(actor, board);
  const move = new PawnAgentMovement(
    actor,
    board,
    { Stop: orders.Stop, MoveToTarget: jest.fn(), MoveToLocation: jest.fn() },
    () => null
  );
  const report = jest.fn();
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, token) => (token === IdComponent ? ({ id: "pawn" } as never) : undefined));
  jest
    .mocked(getSceneService)
    .mockImplementation((_scene, token) =>
      token === CommandBusService
        ? ({ reportPersistedOutcome: report } as never)
        : token === SimulationTickService
          ? ({ currentTick: 53 } as never)
          : undefined
    );
  const nativeMove = jest.fn(async () => false),
    cancelMovement = jest.fn(),
    canMoveTo = jest.fn(async () => false);
  jest.mocked(getActorSystem).mockReturnValue({
    moveToLocationByFollowingStaticPath: nativeMove,
    moveToActorByAdjustingPathDynamically: nativeMove,
    canMoveTo,
    cancelMovement
  } as never);
  return { actor, board, order, orders, move, report, nativeMove, canMoveTo, cancelMovement };
}

describe("native Move refusal settles its command", () => {
  beforeEach(() => jest.resetAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("settles and cleans an actual build order after its target has finished", () => {
    const f = fixture(OrderType.Build);
    expect(f.orders.Stop("Build - Construction Finished")).toBe(State.SUCCEEDED);
    expect(f.report).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: "command",
        actorIds: ["pawn"],
        kind: "completed",
        reason: "applied"
      })
    );
    expect(f.board.getCurrentOrder()).toBeUndefined();
    expect(f.board.anyOrderInQueue()).toBe(false);
    expect(f.cancelMovement).toHaveBeenCalledTimes(1);
  });

  it("reports failure at the native no-path return and removes the order instead of waiting 7200 ticks", async () => {
    const f = fixture();
    expect(await f.move.MoveToLocation()).toBe(State.FAILED);
    expect(f.report).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: "command",
        tick: 53,
        actorIds: ["pawn"],
        kind: "failed",
        reason: "application_failed"
      })
    );
    expect(f.board.getCurrentOrder()).toBeUndefined();
    expect(f.board.anyOrderInQueue()).toBe(false);
    expect(f.cancelMovement).toHaveBeenCalledTimes(1);
  });

  it.each(["probe", "movement"] as const)("settles the target Move when its %s returns false", async (boundary) => {
    const f = fixture();
    f.order.data.targetGameObject = f.actor;
    if (boundary === "movement") f.canMoveTo.mockResolvedValue(true);
    expect(await f.move.MoveToTarget("move")).toBe(State.FAILED);
    expect(f.report).toHaveBeenCalledTimes(1);
    expect(f.board.anyOrderInQueue()).toBe(false);
  });

  it("does not terminate a replacement order when an earlier movement resolves false", async () => {
    const f = fixture();
    let resolve: ((result: boolean) => void) | undefined;
    f.nativeMove.mockImplementation(
      () =>
        new Promise<boolean>((release) => {
          resolve = release;
        })
    );
    const pending = f.move.MoveToLocation();
    const replacement = new OrderData(OrderType.Move, { targetTileLocation: { x: 1, y: 1, z: 0 } });
    f.board.setCurrentOrder(replacement);
    if (!resolve) throw new Error("movement_pending_missing");
    resolve(false);
    expect(await pending).toBe(State.FAILED);
    expect(f.report).not.toHaveBeenCalled();
    expect(f.board.getCurrentOrder()).toBe(replacement);
    expect(f.cancelMovement).not.toHaveBeenCalled();
  });

  it("retains attack-move recovery and successful Move completion ownership", async () => {
    const attack = fixture(OrderType.Attack);
    expect(await attack.move.MoveToLocation()).toBe(State.FAILED);
    expect(attack.report).not.toHaveBeenCalled();
    expect(attack.board.getCurrentOrder()).toBe(attack.order);
    const success = fixture();
    success.nativeMove.mockResolvedValue(true);
    expect(await success.move.MoveToLocation()).toBe(State.SUCCEEDED);
    expect(success.report).not.toHaveBeenCalled();
    expect(success.board.getCurrentOrder()).toBe(success.order);
  });

  it("does not settle a newer target Move when the earlier probe is refused", async () => {
    const f = fixture();
    f.order.data.targetGameObject = f.actor;
    const pending = f.move.MoveToTarget("move");
    const replacement = new OrderData(OrderType.Move);
    f.board.setCurrentOrder(replacement);
    expect(await pending).toBe(State.FAILED);
    expect(f.report).not.toHaveBeenCalled();
    expect(f.board.getCurrentOrder()).toBe(replacement);
  });

  it.each([false, true])("native exceptions settle only their current order (replaced=%s)", async (replaced) => {
    const f = fixture();
    f.nativeMove.mockRejectedValue(new Error("native path failed"));
    const pending = f.move.MoveToLocation();
    if (replaced) f.board.setCurrentOrder(new OrderData(OrderType.Move));
    expect(await pending).toBe(State.FAILED);
    expect(f.report).toHaveBeenCalledTimes(replaced ? 0 : 1);
  });
});
