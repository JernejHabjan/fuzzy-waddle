import { MovementQueryObservation } from "./movement-query-observation";
import { MovementCompletionObservation } from "./movement-completion-observation";
import type { MovementCompletionEvent } from "./movement-completion-event";
import type { MovementQueryContext } from "./movement-query-context";
import { PawnAiBlackboard } from "../../prefabs/ai-agents/pawn-ai-blackboard";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { getGameObjectCurrentTile } from "../../data/game-object-helper";
import { MovementTween } from "./movement-tween";
import { MovementPresentation } from "./movement-presentation";
import { MovementPathExecution } from "./movement-path-execution";
import { MovementStepBlockedError } from "./movement-step-blocked-error";
import { movementTestFixture } from "./movement-test-fixture";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneComponent: jest.fn(), getSceneService: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({
  getGameObjectCurrentTile: jest.fn(), isGameObjectActiveInActiveScene: jest.fn(), isSceneActive: jest.fn()
}));

function fixture() {
  const f = movementTestFixture(), presentation = new MovementPresentation(f.runtime);
  const tween = new MovementTween(f.runtime, presentation);
  const execution = new MovementPathExecution(f.runtime, tween, presentation);
  const cancel = jest.spyOn(tween, "cancelMovement").mockImplementation(() => undefined);
  const animate = jest.spyOn(presentation, "playMovementAnimation").mockImplementation(() => undefined);
  const move = jest.spyOn(tween, "moveActorToTileWithTween").mockImplementation(async (_tile, _config, complete) => {
    await complete?.();
  });
  return { ...f, execution, tween, presentation, cancel, animate, move };
}

describe("native static path execution/recovery extraction (unrun until final gate)", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("consumes the same path and retains recursive callback/cancel/animation order", async () => {
    const f = fixture(), order: string[] = [], path = [{ x: 1, y: 0 }, { x: 2, y: 0 }];
    f.cancel.mockImplementation(() => { order.push("cancel"); });
    f.animate.mockImplementation(() => { order.push("animation"); });
    await f.execution.moveAlongPathByFollowingPreCalculatedStaticPath(path, {
      onPathUpdate: (tile) => { order.push(`step:${tile.x}`); }, onComplete: () => { order.push("complete"); }
    });
    expect(path).toEqual([]);
    expect(order).toEqual(["cancel", "step:1", "cancel", "step:2", "complete", "animation"]);
  });

  it("waits twice on active step blockers, then repaths with destinations excluded", async () => {
    const f = fixture(), blocked = { x: 1, y: 0 }, end = { x: 2, y: 0 };
    const error = new MovementStepBlockedError(blocked, ["actor:2"]);
    f.move.mockRejectedValueOnce(error).mockRejectedValueOnce(error).mockRejectedValueOnce(error);
    jest.mocked(getGameObjectCurrentTile).mockReturnValue(undefined); // No available sidestep geometry.
    f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers.mockResolvedValue([{ x: 0, y: 0 }, end]);
    await f.execution.moveAlongPathByFollowingPreCalculatedStaticPath([blocked, end]);
    expect(f.delayedCall).toHaveBeenCalledTimes(2);
    expect(f.delayedCall).toHaveBeenNthCalledWith(1, 120, expect.any(Function));
    expect(f.move.mock.calls.map(([tile]) => tile)).toEqual([blocked, blocked, blocked, end]);
    expect(f.occupancy.getDynamicBlockersForActor).toHaveBeenCalledWith("actor:1", { includeDestinationReservations: false });
    expect(f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers).toHaveBeenCalledWith(f.actor, end, []);
  });

  it("retains bounded repath waits and the original blocked error when fallback has no candidate", async () => {
    const f = fixture(), tile = { x: 1, y: 0 }, error = new MovementStepBlockedError(tile, ["actor:2"]);
    f.move.mockRejectedValue(error); f.occupancy.hasAnyActiveStepReservation.mockReturnValue(false);
    jest.mocked(getGameObjectCurrentTile).mockReturnValue(undefined);
    await expect(f.execution.moveAlongPathByFollowingPreCalculatedStaticPath([tile])).rejects.toBe(error);
    expect(f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers).toHaveBeenCalledTimes(3);
    expect(f.delayedCall).toHaveBeenCalledTimes(2);
    expect(f.occupancy.reserveDestination).not.toHaveBeenCalled();
  });

  it("reserves a ranked same-height fallback before the final repath", async () => {
    const f = fixture(), tile = { x: 1, y: 0 }, error = new MovementStepBlockedError(tile, ["actor:2"]);
    const candidate = { x: 1, y: -1 }, ordering: string[] = [];
    const context: MovementQueryContext = { actor: f.actor, board: new PawnAiBlackboard(),
      order: null, caller: "boarding_container_shore" };
    const callers: ReturnType<typeof MovementQueryObservation.current>[] = [];
    const events: MovementCompletionEvent[] = [];
    const release = MovementCompletionObservation.subscribe(context.board, (event) => events.push(event));
    const completion = MovementCompletionObservation.begin(context, "path", tile);
    completion?.destination(tile);
    f.move.mockImplementation(async (destination, _config, complete) => {
      jest.mocked(getGameObjectCurrentTile).mockReturnValue({ ...destination, z: 0 }); await complete?.();
    });
    f.move.mockRejectedValueOnce(error); f.occupancy.hasAnyActiveStepReservation.mockReturnValue(false);
    jest.mocked(getGameObjectCurrentTile).mockReturnValue(undefined);
    f.navigation.isWithinGridBounds.mockReturnValue(true);
    f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers.mockImplementation(async (_actor, destination) => {
      ordering.push(`path:${destination.x},${destination.y}`);
      callers.push(MovementQueryObservation.current(f.actor));
      return destination.x === candidate.x && destination.y === candidate.y ? [{ x: 0, y: 0 }, candidate] : null;
    });
    f.occupancy.reserveDestination.mockImplementation(() => { ordering.push("reserve"); return true; });
    await f.execution.moveAlongPathByFollowingPreCalculatedStaticPath([tile], undefined, undefined, context, completion);
    expect(callers.map((caller) => caller?.stage)).toEqual(["repath", "repath", "repath", "fallback", "fallback"]);
    expect(callers.every((caller) => caller?.context === context)).toBe(true);
    expect(MovementQueryObservation.current(f.actor)).toBeUndefined();
    expect(f.occupancy.reserveDestination).toHaveBeenCalledWith("actor:1", [candidate], 0);
    expect(ordering.slice(-2)).toEqual(["reserve", "path:1,-1"]);
    expect(events.at(-1)).toMatchObject({ phase: "arrived", originalDestination: tile,
      selectedDestination: candidate, actualTile: candidate, fallback: true }); release();
  });

  it("does not turn arbitrary movement or native repath errors into congestion retries", async () => {
    const f = fixture(), tile = { x: 1, y: 0 }, error = new Error("native_failure");
    f.move.mockRejectedValueOnce(error);
    await expect(f.execution.moveAlongPathByFollowingPreCalculatedStaticPath([tile])).rejects.toBe(error);
    expect(f.delayedCall).not.toHaveBeenCalled();
    f.move.mockRejectedValueOnce(new MovementStepBlockedError(tile, ["actor:2"]));
    f.occupancy.hasAnyActiveStepReservation.mockReturnValue(false);
    jest.mocked(getGameObjectCurrentTile).mockReturnValue(undefined);
    f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers.mockRejectedValue(error);
    await expect(f.execution.moveAlongPathByFollowingPreCalculatedStaticPath([tile])).rejects.toBe(error);
    expect(f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers).toHaveBeenCalledTimes(1);
  });

  it("retains native onStop without silently invoking the remaining path", async () => {
    const f = fixture(), path: Vector2Simple[] = [{ x: 1, y: 0 }, { x: 2, y: 0 }], onStop = jest.fn();
    f.move.mockImplementationOnce(async (_tile, _config, _complete, stop) => { stop?.(); });
    await f.execution.moveAlongPathByFollowingPreCalculatedStaticPath(path, { onStop });
    expect(onStop).toHaveBeenCalledTimes(1); expect(f.move).toHaveBeenCalledTimes(1);
    expect(path).toEqual([{ x: 2, y: 0 }]); expect(f.animate).toHaveBeenCalledWith(false, { onStop });
  });

  it("observes physical arrival before a failing user completion callback without changing the thrown error", async () => {
    const f = fixture(), events: MovementCompletionEvent[] = [], order: string[] = [];
    const context: MovementQueryContext = { actor: f.actor, board: new PawnAiBlackboard(),
      order: null, caller: "boarding_container_shore" };
    const release = MovementCompletionObservation.subscribe(context.board, (event) => {
      events.push(event); if (event.phase === "arrived") order.push("arrival");
    });
    const completion = MovementCompletionObservation.begin(context, "path", { x: 1, y: 0 });
    completion?.destination({ x: 1, y: 0 });
    const error = new Error("native_user_callback");
    f.move.mockImplementationOnce(async (_tile, _config, complete) => {
      jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 1, y: 0, z: 0 }); await complete?.();
    });
    await expect(f.execution.moveAlongPathByFollowingPreCalculatedStaticPath([{ x: 1, y: 0 }], {
      onComplete: () => { order.push("callback"); throw error; }
    }, undefined, context, completion)).rejects.toBe(error);
    expect(order).toEqual(["arrival", "callback"]);
    expect(events.at(-1)).toMatchObject({ phase: "arrived", actualTile: { x: 1, y: 0 }, fallback: false });
    expect(f.animate).not.toHaveBeenCalled(); release();
  });
});
