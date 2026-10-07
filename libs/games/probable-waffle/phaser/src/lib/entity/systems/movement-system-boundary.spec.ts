import { MovementQueryObservation } from "./movement-query-observation";
import type { MovementQueryContext } from "./movement-query-context";
import type Phaser from "phaser";
import type { GameCommand, MoveCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { PawnAiBlackboard } from "../../prefabs/ai-agents/pawn-ai-blackboard";
import { MovementFormation } from "./movement-formation";
import { OrderType } from "../../ai/order-type";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { getActorComponent } from "../../data/actor-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { onObjectReady } from "../../data/game-object-helper";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { FlyingComponent } from "../components/movement/flying-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { MovementRuntime } from "./movement-runtime";
import { MovementTween } from "./movement-tween";
import { MovementPathExecution } from "./movement-path-execution";
import { MovementSystem, getIsoDirectionFromDirectionalVector } from "./movement.system";
import { movementTestFixture } from "./movement-test-fixture";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneComponent: jest.fn(), getSceneService: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({
  getGameObjectCurrentTile: jest.fn(), isGameObjectActiveInActiveScene: jest.fn(), isSceneActive: jest.fn(), onObjectReady: jest.fn()
}));
jest.mock("../../prefabs/ai-agents/pawn-ai-controller", () => ({ PawnAiController: class {} }));

function fixture() {
  const f = movementTestFixture(), unsubscribe = jest.fn();
  let receive: ((command: GameCommand) => Promise<void>) | undefined;
  const commandBus = { reportOutcome: jest.fn(), command$: { subscribe: jest.fn((callback: typeof receive) => {
    receive = callback; return { unsubscribe };
  }) } };
  const originalLookup = jest.mocked(getSceneService).getMockImplementation();
  jest.mocked(getSceneService).mockImplementation((scene, service) => service === CommandBusService
    ? commandBus as never : originalLookup?.(scene, service));
  const system = new MovementSystem(f.actor);
  const deliver = async (command: GameCommand) => {
    if (!receive) throw new Error("movement_test_subscription_missing");
    await receive(command);
  };
  return { ...f, system, commandBus, unsubscribe, deliver };
}

describe("movement facade extraction boundaries (unrun until final gate)", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("retains command subscription before readiness and kill cleanup through the public system token", () => {
    const order: string[] = [];
    const init = jest.spyOn(MovementRuntime.prototype, "init").mockImplementation(() => { order.push("ready"); });
    const f = fixture();
    expect(init).toHaveBeenCalledTimes(1); // Fixture readiness only; constructing the facade does not resample.
    expect(f.commandBus.command$.subscribe).toHaveBeenCalledTimes(1);
    const ready = jest.mocked(onObjectReady).mock.calls[0];
    if (!ready) throw new Error("movement_test_ready_missing");
    expect(ready[0]).toBe(f.actor); expect(ready[2]).toBe(f.system);
    ready[1].call(f.system);
    expect(order).toEqual(["ready", "ready"]);
    const cancel = jest.spyOn(MovementTween.prototype, "cancelMovement").mockImplementation(() => { order.push("cancel"); });
    const kill = jest.mocked(f.actor.once).mock.calls[0];
    if (!kill || typeof kill[1] !== "function") throw new Error("movement_test_kill_missing");
    expect(kill[0]).toBe(HealthComponent.KilledEvent); expect(kill[2]).toBe(f.system);
    kill[1].call(f.system);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(f.occupancy.releaseAll).toHaveBeenCalledWith("actor:1");
    expect(f.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("keeps native mutable path consumption, callbacks and final destination release", async () => {
    const f = fixture(), destination = { x: 3, y: 4, z: 0 }, path = [{ x: 0, y: 0 }, destination];
    const context: MovementQueryContext = { actor: f.actor, board: new PawnAiBlackboard(),
      order: null, caller: "boarding_container_shore" };
    f.navigation.findPathFromGameObjectToTile.mockImplementation(async () => {
      expect(MovementQueryObservation.current(f.actor)).toEqual({ context, stage: "initial" }); return path;
    });
    const config = { onComplete: jest.fn() };
    const execute = jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
      .mockImplementation(async (received, receivedConfig, _recovery, receivedContext) => {
        expect(receivedContext).toBe(context); expect(MovementQueryObservation.current(f.actor)).toBeUndefined();
        expect(received).toBe(path); expect(receivedConfig).toBe(config); expect(received).toEqual([destination]);
      });
    expect(await f.system.moveToLocationByFollowingStaticPath(destination, config, context)).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(f.navigation.findPathFromGameObjectToTile).toHaveBeenCalledWith(f.actor, destination);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledWith("actor:1");
  });

  it.each([null, []] satisfies (Vector2Simple[] | null)[])("preserves native no-path result %p", async (path) => {
    const f = fixture(); f.navigation.findPathFromGameObjectToTile.mockResolvedValue(path);
    const execute = jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath");
    expect(await f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 1, z: 0 })).toBe(false);
    expect(execute).not.toHaveBeenCalled(); expect(f.occupancy.releaseDestination).not.toHaveBeenCalled();
  });

  it("keeps query errors outside the path-execution catch and movement errors inside it", async () => {
    const f = fixture(), error = new Error("native_movement");
    f.navigation.findPathFromGameObjectToTile.mockRejectedValueOnce(error);
    await expect(f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 1, z: 0 })).rejects.toBe(error);
    expect(f.occupancy.releaseDestination).not.toHaveBeenCalled();
    f.navigation.findPathFromGameObjectToTile.mockResolvedValue([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath").mockRejectedValue(error);
    expect(await f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 1, z: 0 })).toBe(false);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledTimes(1);
  });

  it("keeps flying movement direct and radius queries as probes with no path execution", async () => {
    const f = fixture(), target = { scene: f.scene } as Phaser.GameObjects.GameObject;
    const direct = jest.spyOn(MovementTween.prototype, "moveDirectlyToLocationWithoutPathfinding").mockResolvedValue();
    jest.mocked(getActorComponent).mockImplementation((_actor, component) => component === FlyingComponent ? {} as never : undefined);
    expect(await f.system.moveToActorByAdjustingPathDynamically(target)).toBe(true);
    expect(direct).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 }, undefined);
    expect(f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius).not.toHaveBeenCalled();
    const path = [{ x: 0, y: 0 }]; f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius.mockResolvedValue(path);
    expect(await f.system.getPathToClosestNavigableTileBetweenGameObjectsInRadius(target, 3)).toBe(path);
    expect(await f.system.canMoveTo(target, 3)).toBe(true);
    expect(path).toHaveLength(1); expect(direct).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])("keeps stamped shared MOVE admission and outcome order (queue=%p)", async (queue) => {
    const f = fixture(), board = new PawnAiBlackboard(), order: string[] = [];
    const lookup = jest.mocked(getActorComponent).getMockImplementation();
    jest.mocked(getActorComponent).mockImplementation((actor, component) => component === PawnAiController
      ? { blackboard: board } as never : lookup?.(actor, component));
    const admitted = jest.spyOn(board, queue ? "addOrder" : "overrideOrderQueueAndActiveOrder");
    const destination = { x: 4, y: 5, z: 0 };
    jest.spyOn(MovementFormation.prototype, "getTileVec3ByDynamicFlocking").mockImplementation(async () => {
      order.push("formation"); return destination;
    });
    f.commandBus.reportOutcome.mockImplementation(() => { order.push("applied"); });
    const command = { type: "MOVE", tick: 10, playerNumber: 1, actorIds: ["actor:1"], queue,
      tileVec3: { x: 8, y: 9, z: 0 }, worldVec3: { x: 80, y: 90, z: 0 },
      execution: { schemaVersion: 1, commandId: "move:1", commitmentKey: "move", source: "ai", authorityEpoch: 1,
        sequence: 1, intentId: "intent:1", effectId: "effect:1" }
    } satisfies MoveCommand;
    await f.deliver(command);
    const actual = admitted.mock.calls[0]?.[0];
    if (!actual) throw new Error("movement_test_admission_missing");
    expect(actual.orderType).toBe(OrderType.Move); expect(actual.data.targetTileLocation).toBe(destination);
    expect(actual.data.commandContext).toEqual({ execution: command.execution, playerNumber: 1, actorIds: command.actorIds });
    expect(order).toEqual(["formation", "applied"]);
    expect(f.commandBus.reportOutcome).toHaveBeenCalledWith(command, "applied", "applied", ["actor:1"]);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledWith("actor:1");
  });

  it("keeps direct non-pawn outcomes and native formation failure reporting", async () => {
    const f = fixture(), command = { type: "MOVE", tick: 10, playerNumber: 1, actorIds: ["actor:1"], queue: false,
      tileVec3: { x: 1, y: 0, z: 0 }, worldVec3: { x: 1, y: 0, z: 0 }
    } satisfies MoveCommand;
    jest.spyOn(f.system, "moveToLocationByFollowingStaticPath").mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await f.deliver(command);
    expect(f.commandBus.reportOutcome).toHaveBeenLastCalledWith(command, "completed", "applied", ["actor:1"]);
    await f.deliver(command);
    expect(f.commandBus.reportOutcome).toHaveBeenLastCalledWith(command, "failed", "application_failed", ["actor:1"]);
    jest.spyOn(MovementFormation.prototype, "getTileVec3ByDynamicFlocking").mockRejectedValue(new Error("native_formation"));
    await f.deliver(command);
    expect(f.commandBus.reportOutcome).toHaveBeenLastCalledWith(command, "failed", "application_failed", ["actor:1"], [],
      "movement_application_failed");
  });

  it("retains the exported isometric direction mapping", () => {
    expect(getIsoDirectionFromDirectionalVector(0, 0)).toBe("south");
    expect(getIsoDirectionFromDirectionalVector(4, 1)).toBe("east");
    expect(getIsoDirectionFromDirectionalVector(1, 4)).toBe("south");
    expect(getIsoDirectionFromDirectionalVector(-2, -1)).toBe("northwest");
  });
});
