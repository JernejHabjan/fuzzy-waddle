import { MovementQueryObservation } from "./movement-query-observation";
import { MovementCompletionObservation } from "./movement-completion-observation";
import type { MovementCompletionEvent } from "./movement-completion-event";
import type { MovementQueryContext } from "./movement-query-context";
import type Phaser from "phaser";
import type { GameCommand, MoveCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import { PawnAiController } from "../../prefabs/ai-agents/controller/pawn-ai-controller";
import { PawnAiBlackboard } from "../../prefabs/ai-agents/controller/pawn-ai-blackboard";
import { MovementFormation } from "./movement-formation";
import { OrderType } from "../../ai/order-type";
import { OrderData } from "../../ai/OrderData";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { getActorComponent } from "../../data/actor-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import {
  getGameObjectCurrentTile,
  isGameObjectActiveInActiveScene,
  onObjectReady
} from "../../data/game-object-helper";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { FlyingComponent } from "../components/movement/flying-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { MovementRuntime } from "./movement-runtime";
import { MovementTween } from "./movement-tween";
import { MovementPathExecution } from "./movement-path-execution";
import { MovementSystem, getIsoDirectionFromDirectionalVector } from "./movement.system";
import { movementTestFixture } from "./movement-test-fixture";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({
  getSceneComponent: jest.fn(),
  getSceneService: jest.fn()
}));
jest.mock("../../data/game-object-helper", () => ({
  getGameObjectCurrentTile: jest.fn(),
  isGameObjectActiveInActiveScene: jest.fn(),
  isSceneActive: jest.fn(),
  onObjectReady: jest.fn()
}));
jest.mock("../../prefabs/ai-agents/controller/pawn-ai-controller", () => ({ PawnAiController: class {} }));

function fixture() {
  const f = movementTestFixture(),
    unsubscribe = jest.fn();
  let receive: ((command: GameCommand) => Promise<void>) | undefined;
  const commandBus = {
    reportOutcome: jest.fn(),
    command$: {
      subscribe: jest.fn((callback: typeof receive) => {
        receive = callback;
        return { unsubscribe };
      })
    }
  };
  const originalLookup = jest.mocked(getSceneService).getMockImplementation();
  jest
    .mocked(getSceneService)
    .mockImplementation((scene, service) =>
      service === CommandBusService ? (commandBus as never) : originalLookup?.(scene, service)
    );
  const system = new MovementSystem(f.actor);
  const deliver = async (command: GameCommand) => {
    if (!receive) throw new Error("movement_test_subscription_missing");
    await receive(command);
  };
  return { ...f, system, commandBus, unsubscribe, deliver };
}

describe("movement facade boundaries", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("avoids an already occupied corridor at admission while leaving range probes read-only", async () => {
    const f = fixture(),
      blocked = { x: 1, y: 0 },
      endpoint = { x: 2, y: 0 },
      detour = { x: 1, y: 1 };
    f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius.mockResolvedValue([
      { x: 0, y: 0 },
      blocked,
      endpoint
    ]);
    f.occupancy.getDynamicBlockersForActor.mockReturnValue([{ tile: blocked, heightLayer: 0 }]);
    f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers.mockResolvedValue([
      { x: 0, y: 0 },
      detour,
      endpoint
    ]);
    await f.system.canMoveTo(f.actor);
    expect(f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers).not.toHaveBeenCalled();
    const execute = jest
      .spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
      .mockResolvedValue(undefined);
    expect(await f.system.moveToActorByAdjustingPathDynamically(f.actor)).toBe(true);
    expect(execute.mock.calls[0]?.[0]).toEqual([detour, endpoint]);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledWith("actor:1");
  });

  it("reselects an endpoint contested during an awaited object route and releases the chosen slot after arrival", async () => {
    const f = fixture(),
      first = { x: 1, y: 0 },
      next = { x: 0, y: 1 };
    f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius
      .mockResolvedValueOnce([{ x: 0, y: 0 }, first])
      .mockResolvedValueOnce([{ x: 0, y: 0 }, next]);
    f.occupancy.reserveDestination.mockReturnValueOnce(false);
    const execute = jest
      .spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
      .mockResolvedValue(undefined);
    expect(await f.system.moveToActorByAdjustingPathDynamically(f.actor)).toBe(true);
    expect(execute.mock.calls[0]?.[0]).toEqual([next]);
    expect(f.occupancy.reserveDestination.mock.calls.map((call) => call[1])).toEqual([[first], [next]]);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledWith("actor:1");
  });

  it("does not start a stale awaited route after its owning order is replaced", async () => {
    const f = fixture(),
      board = new PawnAiBlackboard(),
      order = new OrderData(OrderType.Move);
    board.setCurrentOrder(order);
    const lookup = jest.mocked(getActorComponent).getMockImplementation();
    jest
      .mocked(getActorComponent)
      .mockImplementation((actor, component) =>
        component === PawnAiController ? ({ blackboard: board } as never) : lookup?.(actor, component)
      );
    f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius.mockImplementation(async () => {
      board.setCurrentOrder(new OrderData(OrderType.Stop));
      return [
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ];
    });
    const execute = jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath");
    // No opt-in capture context: ordinary gameplay owns exactly the same order fence.
    expect(await f.system.moveToActorByAdjustingPathDynamically(f.actor)).toBe(false);
    expect(execute).not.toHaveBeenCalled();
    expect(f.occupancy.reserveDestination).not.toHaveBeenCalled();
  });

  it.each(["cancel", "new move"] as const)(
    "does not execute an initial location path after %s",
    async (replacement) => {
      const f = fixture();
      let resolvePath: ((path: Vector2Simple[]) => void) | undefined;
      f.navigation.findPathFromGameObjectToTile.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePath = resolve;
          })
      );
      const execute = jest
        .spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
        .mockResolvedValue(undefined);
      const first = f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 0, z: 0 });
      if (!resolvePath) throw new Error("initial_path_not_pending");
      if (replacement === "cancel") f.system.cancelMovement();
      else {
        f.navigation.findPathFromGameObjectToTile.mockResolvedValue([
          { x: 0, y: 0 },
          { x: 2, y: 0 }
        ]);
        expect(await f.system.moveToLocationByFollowingStaticPath({ x: 2, y: 0, z: 0 })).toBe(true);
      }
      resolvePath([
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ]);
      expect(await first).toBe(false);
      expect(execute).toHaveBeenCalledTimes(replacement === "cancel" ? 0 : 1);
    }
  );

  it("does not reserve an object-target path that resolves after cancellation without a pawn order", async () => {
    const f = fixture();
    let resolvePath: ((path: Vector2Simple[]) => void) | undefined;
    f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePath = resolve;
        })
    );
    const execute = jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath");
    const pending = f.system.moveToActorByAdjustingPathDynamically(f.actor);
    if (!resolvePath) throw new Error("object_path_not_pending");
    f.system.cancelMovement();
    resolvePath([
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ]);
    expect(await pending).toBe(false);
    expect(f.occupancy.reserveDestination).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("does not release a newer destination when an older path settles", async () => {
    const f = fixture();
    const complete: Array<() => void> = [];
    f.navigation.findPathFromGameObjectToTile.mockImplementation(async (_actor, tile) => [{ x: 0, y: 0 }, tile]);
    jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          complete.push(resolve);
        })
    );
    const first = f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 0, z: 0 });
    await Promise.resolve();
    const second = f.system.moveToLocationByFollowingStaticPath({ x: 2, y: 0, z: 0 });
    await Promise.resolve();
    if (complete.length !== 2) throw new Error("movement_paths_not_started");
    complete[0]?.();
    expect(await first).toBe(true);
    expect(f.occupancy.releaseDestination).not.toHaveBeenCalled();
    complete[1]?.();
    expect(await second).toBe(true);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledTimes(1);
  });

  it("releases the old destination if a newer path request fails before starting", async () => {
    const f = fixture();
    let finish: (() => void) | undefined;
    f.navigation.findPathFromGameObjectToTile
      .mockResolvedValueOnce([
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ])
      .mockResolvedValueOnce(null);
    jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const first = f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 0, z: 0 });
    await Promise.resolve();
    expect(await f.system.moveToLocationByFollowingStaticPath({ x: 2, y: 0, z: 0 })).toBe(false);
    if (!finish) throw new Error("movement_path_not_started");
    finish();
    expect(await first).toBe(true);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledTimes(1);
  });

  it("does not release a formation reservation installed by a newer move command", async () => {
    const f = fixture();
    let finish: (() => void) | undefined;
    f.navigation.findPathFromGameObjectToTile.mockResolvedValue([
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ]);
    jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath").mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const old = f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 0, z: 0 });
    await Promise.resolve();
    if (!finish) throw new Error("movement_path_not_started");
    const board = new PawnAiBlackboard();
    const lookup = jest.mocked(getActorComponent).getMockImplementation();
    jest
      .mocked(getActorComponent)
      .mockImplementation((actor, component) =>
        component === PawnAiController ? ({ blackboard: board } as never) : lookup?.(actor, component)
      );
    jest.spyOn(MovementFormation.prototype, "getTileVec3ByDynamicFlocking").mockResolvedValue({ x: 4, y: 5, z: 0 });
    await f.deliver({
      type: "MOVE",
      tick: 10,
      playerNumber: 1,
      actorIds: ["actor:1"],
      queue: false,
      tileVec3: { x: 4, y: 5, z: 0 },
      worldVec3: { x: 4, y: 5, z: 0 }
    } satisfies MoveCommand);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledTimes(1);
    finish();
    await old;
    expect(f.occupancy.releaseDestination).toHaveBeenCalledTimes(1);
  });

  it("discards an initial path once a newer move command is admitted", async () => {
    const f = fixture();
    let resolvePath: ((path: Vector2Simple[]) => void) | undefined;
    f.navigation.findPathFromGameObjectToTile.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePath = resolve;
        })
    );
    const execute = jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath");
    const old = f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 0, z: 0 });
    if (!resolvePath) throw new Error("initial_path_not_pending");
    const board = new PawnAiBlackboard();
    const lookup = jest.mocked(getActorComponent).getMockImplementation();
    jest
      .mocked(getActorComponent)
      .mockImplementation((actor, component) =>
        component === PawnAiController ? ({ blackboard: board } as never) : lookup?.(actor, component)
      );
    jest.spyOn(MovementFormation.prototype, "getTileVec3ByDynamicFlocking").mockResolvedValue({ x: 4, y: 5, z: 0 });
    await f.deliver({
      type: "MOVE",
      tick: 10,
      playerNumber: 1,
      actorIds: ["actor:1"],
      queue: false,
      tileVec3: { x: 4, y: 5, z: 0 },
      worldVec3: { x: 4, y: 5, z: 0 }
    } satisfies MoveCommand);
    resolvePath([
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ]);
    expect(await old).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });

  it("bounds endpoint-contention retries without moving to an unreserved slot", async () => {
    const f = fixture();
    f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius.mockResolvedValue([
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ]);
    f.occupancy.reserveDestination.mockReturnValue(false);
    const execute = jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath");
    expect(await f.system.moveToActorByAdjustingPathDynamically(f.actor)).toBe(false);
    expect(f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius).toHaveBeenCalledTimes(3);
    expect(execute).not.toHaveBeenCalled();
  });

  it("retains command subscription before readiness and kill cleanup through the public system token", () => {
    const order: string[] = [];
    const init = jest.spyOn(MovementRuntime.prototype, "init").mockImplementation(() => {
      order.push("ready");
    });
    const f = fixture();
    expect(init).toHaveBeenCalledTimes(1); // Fixture readiness only; constructing the facade does not resample.
    expect(f.commandBus.command$.subscribe).toHaveBeenCalledTimes(1);
    const ready = jest.mocked(onObjectReady).mock.calls[0];
    if (!ready) throw new Error("movement_test_ready_missing");
    expect(ready[0]).toBe(f.actor);
    expect(ready[2]).toBe(f.system);
    ready[1].call(f.system);
    expect(order).toEqual(["ready", "ready"]);
    const cancel = jest.spyOn(MovementTween.prototype, "cancelMovement").mockImplementation(() => {
      order.push("cancel");
    });
    const kill = jest.mocked(f.actor.once).mock.calls[0];
    if (!kill || typeof kill[1] !== "function") throw new Error("movement_test_kill_missing");
    expect(kill[0]).toBe(HealthComponent.KilledEvent);
    expect(kill[2]).toBe(f.system);
    kill[1].call(f.system);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(f.occupancy.releaseAll).toHaveBeenCalledWith("actor:1");
    expect(f.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("keeps native mutable path consumption, callbacks and final destination release", async () => {
    const f = fixture(),
      destination = { x: 3, y: 4, z: 0 },
      path = [{ x: 0, y: 0 }, destination];
    const context: MovementQueryContext = {
      actor: f.actor,
      board: new PawnAiBlackboard(),
      order: null,
      caller: "boarding_container_shore"
    };
    f.navigation.findPathFromGameObjectToTile.mockImplementation(async () => {
      expect(MovementQueryObservation.current(f.actor)).toEqual({ context, stage: "initial" });
      return path;
    });
    const config = { onComplete: jest.fn() };
    const execute = jest
      .spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
      .mockImplementation(async (received, receivedConfig, _recovery, receivedContext) => {
        expect(receivedContext).toBe(context);
        expect(MovementQueryObservation.current(f.actor)).toBeUndefined();
        expect(received).toBe(path);
        expect(receivedConfig).toBe(config);
        expect(received).toEqual([destination]);
      });
    expect(await f.system.moveToLocationByFollowingStaticPath(destination, config, context)).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(f.navigation.findPathFromGameObjectToTile).toHaveBeenCalledWith(f.actor, destination);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledWith("actor:1");
  });

  it.each([null, []] satisfies (Vector2Simple[] | null)[])("preserves native no-path result %p", async (path) => {
    const f = fixture();
    f.navigation.findPathFromGameObjectToTile.mockResolvedValue(path);
    const execute = jest.spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath");
    expect(await f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 1, z: 0 })).toBe(false);
    expect(execute).not.toHaveBeenCalled();
    expect(f.occupancy.releaseDestination).not.toHaveBeenCalled();
  });

  it("keeps query errors outside the path-execution catch and movement errors inside it", async () => {
    const f = fixture(),
      error = new Error("native_movement");
    f.navigation.findPathFromGameObjectToTile.mockRejectedValueOnce(error);
    await expect(f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 1, z: 0 })).rejects.toBe(error);
    expect(f.occupancy.releaseDestination).not.toHaveBeenCalled();
    f.navigation.findPathFromGameObjectToTile.mockResolvedValue([
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ]);
    jest
      .spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
      .mockRejectedValue(error);
    expect(await f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 1, z: 0 })).toBe(false);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledTimes(1);
  });

  it("admits a flying pursuit when ground routing is impossible without executing or reserving movement", async () => {
    const f = fixture(),
      target = { scene: f.scene } as Phaser.GameObjects.GameObject;
    const lookup = jest.mocked(getActorComponent).getMockImplementation();
    jest
      .mocked(getActorComponent)
      .mockImplementation((actor, component) =>
        component === FlyingComponent && actor === f.actor ? ({} as never) : lookup?.(actor, component)
      );
    const direct = jest.spyOn(MovementTween.prototype, "moveDirectlyToLocationWithoutPathfinding");
    expect(await f.system.canMoveTo(target, 1)).toBe(true);
    expect(f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius).not.toHaveBeenCalled();
    expect(direct).not.toHaveBeenCalled();
    expect(f.occupancy.reserveDestination).not.toHaveBeenCalled();
  });

  it("keeps unreachable ground targets refused", async () => {
    const f = fixture();
    expect(await f.system.canMoveTo(f.actor, 1)).toBe(false);
    expect(f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius).toHaveBeenCalledTimes(1);
  });

  it("refuses invalid flying pursuit targets before querying tiles or paths", async () => {
    const f = fixture(),
      target = { scene: f.scene } as Phaser.GameObjects.GameObject;
    jest
      .mocked(getActorComponent)
      .mockImplementation((_actor, component) => (component === FlyingComponent ? ({} as never) : undefined));
    jest.mocked(isGameObjectActiveInActiveScene).mockReturnValue(false);
    expect(await f.system.canMoveTo(target)).toBe(false);
    expect(getGameObjectCurrentTile).not.toHaveBeenCalled();
    jest.mocked(isGameObjectActiveInActiveScene).mockReturnValue(true);
    expect(await f.system.canMoveTo({ scene: {} } as Phaser.GameObjects.GameObject)).toBe(false);
    jest.mocked(getGameObjectCurrentTile).mockReturnValue(undefined);
    expect(await f.system.canMoveTo(target)).toBe(false);
    jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: NaN, y: 1 });
    expect(await f.system.canMoveTo(target)).toBe(false);
    expect(f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius).not.toHaveBeenCalled();
  });

  it("keeps flying movement direct and explicit ground radius queries as read-only probes", async () => {
    const f = fixture(),
      target = { scene: f.scene } as Phaser.GameObjects.GameObject;
    const direct = jest.spyOn(MovementTween.prototype, "moveDirectlyToLocationWithoutPathfinding").mockResolvedValue();
    jest
      .mocked(getActorComponent)
      .mockImplementation((_actor, component) => (component === FlyingComponent ? ({} as never) : undefined));
    expect(await f.system.moveToActorByAdjustingPathDynamically(target)).toBe(true);
    expect(direct).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 }, undefined, undefined);
    expect(f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius).not.toHaveBeenCalled();
    const path = [{ x: 0, y: 0 }];
    f.navigation.findAndUseNavigablePathBetweenGameObjectsWithRadius.mockResolvedValue(path);
    expect(await f.system.getPathToClosestNavigableTileBetweenGameObjectsInRadius(target, 3)).toBe(path);
    expect(await f.system.canMoveTo(target, 3)).toBe(true);
    expect(path).toHaveLength(1);
    expect(direct).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])("keeps stamped shared MOVE admission and outcome order (queue=%p)", async (queue) => {
    const f = fixture(),
      board = new PawnAiBlackboard(),
      order: string[] = [];
    const lookup = jest.mocked(getActorComponent).getMockImplementation();
    jest
      .mocked(getActorComponent)
      .mockImplementation((actor, component) =>
        component === PawnAiController ? ({ blackboard: board } as never) : lookup?.(actor, component)
      );
    const admitted = jest.spyOn(board, queue ? "addOrder" : "overrideOrderQueueAndActiveOrder");
    const destination = { x: 4, y: 5, z: 0 };
    jest.spyOn(MovementFormation.prototype, "getTileVec3ByDynamicFlocking").mockImplementation(async () => {
      order.push("formation");
      return destination;
    });
    f.commandBus.reportOutcome.mockImplementation(() => {
      order.push("applied");
    });
    const command = {
      type: "MOVE",
      tick: 10,
      playerNumber: 1,
      actorIds: ["actor:1"],
      queue,
      tileVec3: { x: 8, y: 9, z: 0 },
      worldVec3: { x: 80, y: 90, z: 0 },
      execution: {
        schemaVersion: 1,
        commandId: "move:1",
        commitmentKey: "move",
        source: "ai",
        authorityEpoch: 1,
        sequence: 1,
        intentId: "intent:1",
        effectId: "effect:1"
      }
    } satisfies MoveCommand;
    await f.deliver(command);
    const actual = admitted.mock.calls[0]?.[0];
    if (!actual) throw new Error("movement_test_admission_missing");
    expect(actual.orderType).toBe(OrderType.Move);
    expect(actual.data.targetTileLocation).toBe(destination);
    expect(actual.data.commandContext).toEqual({
      execution: command.execution,
      playerNumber: 1,
      actorIds: command.actorIds
    });
    expect(order).toEqual(["formation", "applied"]);
    expect(f.commandBus.reportOutcome).toHaveBeenCalledWith(command, "applied", "applied", ["actor:1"]);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledWith("actor:1");
  });

  it("keeps direct non-pawn outcomes and native formation failure reporting", async () => {
    const f = fixture(),
      command = {
        type: "MOVE",
        tick: 10,
        playerNumber: 1,
        actorIds: ["actor:1"],
        queue: false,
        tileVec3: { x: 1, y: 0, z: 0 },
        worldVec3: { x: 1, y: 0, z: 0 }
      } satisfies MoveCommand;
    jest
      .spyOn(f.system, "moveToLocationByFollowingStaticPath")
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    await f.deliver(command);
    expect(f.commandBus.reportOutcome).toHaveBeenLastCalledWith(command, "completed", "applied", ["actor:1"]);
    await f.deliver(command);
    expect(f.commandBus.reportOutcome).toHaveBeenLastCalledWith(command, "failed", "application_failed", ["actor:1"]);
    jest
      .spyOn(MovementFormation.prototype, "getTileVec3ByDynamicFlocking")
      .mockRejectedValue(new Error("native_formation"));
    await f.deliver(command);
    expect(f.commandBus.reportOutcome).toHaveBeenLastCalledWith(
      command,
      "failed",
      "application_failed",
      ["actor:1"],
      [],
      "movement_application_failed"
    );
  });

  it("retains the exported isometric direction mapping", () => {
    expect(getIsoDirectionFromDirectionalVector(0, 0)).toBe("south");
    expect(getIsoDirectionFromDirectionalVector(4, 1)).toBe("east");
    expect(getIsoDirectionFromDirectionalVector(1, 4)).toBe("south");
    expect(getIsoDirectionFromDirectionalVector(-2, -1)).toBe("northwest");
  });

  it("records a stopped execution separately from the unchanged native true return", async () => {
    const f = fixture(),
      board = new PawnAiBlackboard(),
      events: MovementCompletionEvent[] = [];
    const release = MovementCompletionObservation.subscribe(board, (event) => events.push(event));
    const context: MovementQueryContext = { actor: f.actor, board, order: null, caller: "boarding_container_shore" };
    f.navigation.findPathFromGameObjectToTile.mockResolvedValue([
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ]);
    jest
      .spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
      .mockImplementation(async (_path, _config, _recovery, _context, completion) => completion?.terminal("stopped"));
    expect(await f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 0, z: 0 }, undefined, context)).toBe(true);
    expect(events.map((event) => event.phase)).toEqual(["started", "destination", "stopped", "returned_true"]);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledTimes(1);
    release();
  });

  it("uses the nearest reachable legal approach tile for a non-navigable location", async () => {
    const f = fixture(),
      requested = { x: 3, y: 3, z: 0 },
      approach = { x: 3, y: 2 },
      execute = jest
        .spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
        .mockResolvedValue(undefined);
    f.navigation.isWithinGridBounds.mockReturnValue(true);
    f.navigation.isTileNavigable.mockImplementation((tile) => tile.x !== requested.x || tile.y !== requested.y);
    f.navigation.findPathFromGameObjectToTile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([{ x: 0, y: 0 }, approach]);

    expect(await f.system.moveToLocationByFollowingStaticPath(requested)).toBe(true);
    expect(f.navigation.findPathFromGameObjectToTile.mock.calls.map((call) => call[1])).toEqual([requested, approach]);
    expect(execute.mock.calls[0]?.[0]).toEqual([approach]);
  });

  it("searches nearby reachable approach tiles when a caller explicitly permits it", async () => {
    const f = fixture(),
      requested = { x: 3, y: 3, z: 0 },
      approach = { x: 3, y: 2 },
      execute = jest
        .spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
        .mockResolvedValue(undefined);
    f.navigation.isWithinGridBounds.mockReturnValue(true);
    f.navigation.isTileNavigable.mockReturnValue(true);
    f.navigation.findPathFromGameObjectToTile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([{ x: 0, y: 0 }, approach]);

    expect(await f.system.moveToLocationByFollowingStaticPath(requested, undefined, undefined, true)).toBe(true);
    expect(f.navigation.findPathFromGameObjectToTile.mock.calls.map((call) => call[1])).toEqual([requested, approach]);
    expect(execute.mock.calls[0]?.[0]).toEqual([approach]);
  });

  it("does not search nearby tiles for an unreachable navigable destination by default", async () => {
    const f = fixture();
    f.navigation.findPathFromGameObjectToTile.mockResolvedValue(null);

    expect(await f.system.moveToLocationByFollowingStaticPath({ x: 3, y: 3, z: 0 })).toBe(false);
    expect(f.navigation.findPathFromGameObjectToTile).toHaveBeenCalledTimes(1);
  });

  it("keeps query rejection identity while recording no physical arrival", async () => {
    const f = fixture(),
      board = new PawnAiBlackboard(),
      events: MovementCompletionEvent[] = [];
    const release = MovementCompletionObservation.subscribe(board, (event) => events.push(event));
    const error = new Error("native_query"),
      context: MovementQueryContext = {
        actor: f.actor,
        board,
        order: null,
        caller: "boarding_container_shore"
      };
    f.navigation.findPathFromGameObjectToTile.mockRejectedValue(error);
    await expect(f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 0, z: 0 }, undefined, context)).rejects.toBe(
      error
    );
    expect(events.map((event) => event.phase)).toEqual(["started", "threw"]);
    expect(f.occupancy.releaseDestination).not.toHaveBeenCalled();
    release();
  });

  it("does not record a boolean return when native destination cleanup rejects after arrival", async () => {
    const f = fixture(),
      board = new PawnAiBlackboard(),
      events: MovementCompletionEvent[] = [];
    const release = MovementCompletionObservation.subscribe(board, (event) => events.push(event));
    const error = new Error("native_cleanup"),
      context: MovementQueryContext = {
        actor: f.actor,
        board,
        order: null,
        caller: "boarding_container_shore"
      };
    f.navigation.findPathFromGameObjectToTile.mockResolvedValue([
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ]);
    jest
      .spyOn(MovementPathExecution.prototype, "moveAlongPathByFollowingPreCalculatedStaticPath")
      .mockImplementation(async (_path, _config, _recovery, _context, completion) => completion?.terminal("arrived"));
    f.occupancy.releaseDestination.mockImplementation(() => {
      throw error;
    });
    await expect(f.system.moveToLocationByFollowingStaticPath({ x: 1, y: 0, z: 0 }, undefined, context)).rejects.toBe(
      error
    );
    expect(events.map((event) => event.phase)).toEqual(["started", "destination", "arrived"]);
    release();
  });
});
