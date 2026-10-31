import Phaser from "phaser";
import { State } from "mistreevous";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { getGameObjectTileInNavigableRadius } from "../../data/game-object-helper";
import { getActorSystem } from "../../data/actor-system";
import { MovementQueryObservation } from "../../entity/systems/movement-query-observation";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PawnAgentTending } from "./pawn-agent-tending";

jest.mock("../../data/actor-system", () => ({ getActorSystem: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({ getGameObjectTileInNavigableRadius: jest.fn() }));
jest.mock("../../entity/systems/movement-query-observation", () => ({
  MovementQueryObservation: { capture: jest.fn() }
}));

describe("native Field tending movement", () => {
  beforeEach(() => jest.resetAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("moves to a navigable tile near the Field instead of an arbitrary nearby tile", async () => {
    const scene = {} as Phaser.Scene;
    const worker = { scene } as unknown as Phaser.GameObjects.GameObject;
    const field = { scene } as unknown as Phaser.GameObjects.GameObject;
    const board = new PawnAiBlackboard();
    const order = new OrderData(OrderType.Gather, { targetGameObject: field });
    board.addOrder(order);
    board.setCurrentOrder(order);
    const destination = { x: 12, y: 9 };
    const move = jest.fn().mockResolvedValue(true);
    jest.mocked(getGameObjectTileInNavigableRadius).mockResolvedValue(destination);
    jest.mocked(MovementQueryObservation.capture).mockReturnValue(undefined);
    jest.mocked(getActorSystem).mockReturnValue({ moveToLocationByFollowingStaticPath: move } as never);

    await expect(new PawnAgentTending(worker, board).MoveToRandomSpotOnTarget()).resolves.toBe(State.SUCCEEDED);
    expect(getGameObjectTileInNavigableRadius).toHaveBeenCalledWith(field, 2);
    expect(move).toHaveBeenCalledWith({ x: destination.x, y: destination.y, z: 0 }, undefined, undefined, true);
  });

  it("does not start movement when no reachable tending tile exists", async () => {
    const scene = {} as Phaser.Scene;
    const worker = { scene } as unknown as Phaser.GameObjects.GameObject;
    const field = { scene } as unknown as Phaser.GameObjects.GameObject;
    const board = new PawnAiBlackboard();
    const order = new OrderData(OrderType.Gather, { targetGameObject: field });
    board.addOrder(order);
    board.setCurrentOrder(order);
    const move = jest.fn();
    jest.mocked(getGameObjectTileInNavigableRadius).mockResolvedValue(null);
    jest.mocked(getActorSystem).mockReturnValue({ moveToLocationByFollowingStaticPath: move } as never);

    await expect(new PawnAgentTending(worker, board).MoveToRandomSpotOnTarget()).resolves.toBe(State.FAILED);
    expect(move).not.toHaveBeenCalled();
  });
});
