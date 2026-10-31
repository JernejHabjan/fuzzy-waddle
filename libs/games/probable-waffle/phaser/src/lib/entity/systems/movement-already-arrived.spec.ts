import { MovementSystem } from "./movement.system";
import { movementTestFixture } from "./movement-test-fixture";
import { GroundNavigationPathfinder } from "../../world/services/ground-navigation-pathfinder";
import { getGameObjectCurrentTile, isGameObjectActiveInActiveScene } from "../../data/game-object-helper";
import { MovementTween } from "./movement-tween";
import { MovementCompletionObservation } from "./movement-completion-observation";
import type { MovementCompletionEvent } from "./movement-completion-event";
import { PawnAiBlackboard } from "../../prefabs/ai-agents/pawn-ai-blackboard";
import type { MovementQueryContext } from "./movement-query-context";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { Subject } from "rxjs";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";

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
jest.mock("../../prefabs/ai-agents/pawn-ai-controller", () => ({ PawnAiController: class {} }));

function fixture() {
  const f = movementTestFixture(),
    lookup = jest.mocked(getSceneService).getMockImplementation();
  const bus = { command$: new Subject<GameCommand>() } satisfies Pick<CommandBusService, "command$">;
  jest
    .mocked(getSceneService)
    .mockImplementation((scene, token) => (token === CommandBusService ? (bus as never) : lookup?.(scene, token)));
  return { ...f, system: new MovementSystem(f.actor) };
}

describe("native movement to an already reached tile", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("completes real EasyStar empty routes, including a cached route, without a movement step", async () => {
    const f = fixture();
    const paths = new GroundNavigationPathfinder(
      { configureStatic: jest.fn(), configureOverlay: jest.fn() },
      false,
      () => undefined
    );
    paths.setup([
      [0, 0],
      [0, 0]
    ]);
    f.navigation.findPathFromGameObjectToTile.mockImplementation(() => paths.findPath({ x: 0, y: 0 }, { x: 0, y: 0 }));
    const system = f.system,
      board = new PawnAiBlackboard(),
      events: MovementCompletionEvent[] = [];
    const context = { actor: f.actor, board, order: null, caller: "location_movement" } satisfies MovementQueryContext;
    const release = MovementCompletionObservation.subscribe(board, (event) => events.push(event));
    const step = jest.spyOn(MovementTween.prototype, "moveActorToTileWithTween");
    const onComplete = jest.fn();
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        expect(await system.moveToLocationByFollowingStaticPath({ x: 0, y: 0, z: 0 }, { onComplete }, context)).toBe(
          true
        );
      }
      expect(events.map((event) => event.phase)).toEqual([
        "started",
        "destination",
        "arrived",
        "returned_true",
        "started",
        "destination",
        "arrived",
        "returned_true"
      ]);
      expect(events.filter((event) => event.phase === "arrived")).toEqual([
        expect.objectContaining({ selectedDestination: { x: 0, y: 0 }, actualTile: { x: 0, y: 0 }, fallback: false }),
        expect.objectContaining({ selectedDestination: { x: 0, y: 0 }, actualTile: { x: 0, y: 0 }, fallback: false })
      ]);
      expect(onComplete).toHaveBeenCalledTimes(2);
      expect(step).not.toHaveBeenCalled();
      expect(f.occupancy.releaseDestination).toHaveBeenCalledTimes(2);
    } finally {
      release();
    }
  });

  it.each(["null", "different_tile", "missing_tile", "inactive"] as const)(
    "keeps %s failures distinct from an already reached destination",
    async (boundary) => {
      const f = fixture(),
        system = f.system;
      f.navigation.findPathFromGameObjectToTile.mockImplementation(async () => {
        if (boundary === "missing_tile") jest.mocked(getGameObjectCurrentTile).mockReturnValue(undefined);
        if (boundary === "inactive") jest.mocked(isGameObjectActiveInActiveScene).mockReturnValue(false);
        return boundary === "null" ? null : [];
      });
      const onComplete = jest.fn();
      const destination = { x: boundary === "different_tile" ? 1 : 0, y: 0, z: 0 };
      expect(await system.moveToLocationByFollowingStaticPath(destination, { onComplete })).toBe(false);
      expect(onComplete).not.toHaveBeenCalled();
      expect(f.occupancy.releaseDestination).not.toHaveBeenCalled();
    }
  );

  it("cancels earlier movement and releases its step before reporting zero-step arrival", async () => {
    const f = fixture();
    f.navigation.findPathFromGameObjectToTile.mockResolvedValue([]);
    const cancel = jest.spyOn(MovementTween.prototype, "cancelMovement");
    const onComplete = jest.fn(() => {
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(f.occupancy.releaseStep).toHaveBeenCalledWith("actor:1");
    });
    expect(await f.system.moveToLocationByFollowingStaticPath({ x: 0, y: 0, z: 0 }, { onComplete })).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("retains callback failure and destination cleanup on an already reached route", async () => {
    const f = fixture(),
      system = f.system;
    f.navigation.findPathFromGameObjectToTile.mockResolvedValue([]);
    expect(
      await system.moveToLocationByFollowingStaticPath(
        { x: 0, y: 0, z: 0 },
        {
          onComplete: () => {
            throw new Error("arrival_callback");
          }
        }
      )
    ).toBe(false);
    expect(f.occupancy.releaseDestination).toHaveBeenCalledTimes(1);
  });
});
