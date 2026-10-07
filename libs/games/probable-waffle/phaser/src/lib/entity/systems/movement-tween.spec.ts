import Phaser from "phaser";
import { getActorComponent } from "../../data/actor-component";
import { getInterpolatedSimulationNow } from "../../world/services/simulation-time";
import { ActorTranslateComponent } from "../components/movement/actor-translate-component";
import { RepresentableComponent } from "../components/representable-component";
import { MovementPresentation } from "./movement-presentation";
import { MovementTween } from "./movement-tween";
import { MovementStepBlockedError } from "./movement-step-blocked-error";
import { movementTestFixture } from "./movement-test-fixture";

// Local arithmetic/event double avoids changing the shared Phaser mock during the no-validation sweep.
jest.mock("phaser", () => {
  const original = jest.requireActual<{ default: typeof Phaser }>("phaser");
  const phaser = { ...original.default,
    Scenes: { Events: { UPDATE: "update", SHUTDOWN: "shutdown" } },
    Math: { ...original.default.Math,
      Clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
      Linear: (from: number, to: number, progress: number) => from + (to - from) * progress,
      Distance: { Between: (x: number, y: number, tx: number, ty: number) => Math.hypot(tx - x, ty - y) }
    }
  };
  return { ...phaser, default: phaser };
});
jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneComponent: jest.fn(), getSceneService: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({
  getGameObjectCurrentTile: jest.fn(), isGameObjectActiveInActiveScene: jest.fn(), isSceneActive: jest.fn()
}));
jest.mock("../../world/services/simulation-time", () => ({ getInterpolatedSimulationNow: jest.fn() }));
jest.mock("../../campaign/campaign-progression-modifier", () => ({ applyCampaignProgressionModifiers: () => 1 }));

function fixture() {
  const f = movementTestFixture(), positions: { x: number; y: number; z: number }[] = [];
  const translate = { actorTranslateDefinition: { tileMoveDuration: 100 },
    moveActorToLogicalPosition: jest.fn((value: { x: number; y: number; z: number }) => { positions.push({ ...value }); }) };
  const lookup = jest.mocked(getActorComponent).getMockImplementation();
  jest.mocked(getActorComponent).mockImplementation((actor, component) => component === ActorTranslateComponent
    ? translate as never : component === RepresentableComponent ? { logicalWorldTransform: { x: 0, y: 0, z: 0 } } as never
    : lookup?.(actor, component));
  f.runtime.init();
  const presentation = new MovementPresentation(f.runtime);
  jest.spyOn(presentation, "onMovementStart").mockImplementation(() => undefined);
  const animation = jest.spyOn(presentation, "playMovementAnimation").mockImplementation(() => undefined);
  const tween = new MovementTween(f.runtime, presentation);
  jest.mocked(getInterpolatedSimulationNow).mockReturnValue(0);
  return { ...f, tween, presentation, positions, animation };
}

function update(f: ReturnType<typeof fixture>) {
  const listener = f.events.on.mock.calls.find(([event]) => event === Phaser.Scenes.Events.UPDATE);
  if (!listener || typeof listener[1] !== "function") throw new Error("movement_test_update_missing");
  listener[1]();
}

describe("movement interpolation/reservation extraction (unrun until final gate)", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("uses interpolated simulation time and releases the step before awaiting the next callback", async () => {
    const f = fixture();
    let continueCallback: (() => void) | undefined;
    const callback = jest.fn(() => new Promise<void>((resolve) => { continueCallback = resolve; }));
    const pending = f.tween.moveActorToTileWithTween({ x: 1, y: 0 }, undefined, callback);
    expect(f.positions).toEqual([{ x: 0, y: 0, z: 0 }]);
    jest.mocked(getInterpolatedSimulationNow).mockReturnValue(50); update(f);
    expect(f.positions.at(-1)).toEqual({ x: 0.5, y: 0, z: 0 });
    update(f); expect(f.positions.at(-1)).toEqual({ x: 0.5, y: 0, z: 0 });
    jest.mocked(getInterpolatedSimulationNow).mockReturnValue(100); update(f);
    expect(f.occupancy.releaseStep).toHaveBeenCalledWith("actor:1"); expect(callback).toHaveBeenCalledTimes(1);
    expect(f.events.off).toHaveBeenCalledWith(Phaser.Scenes.Events.UPDATE, expect.any(Function));
    expect(f.events.off).toHaveBeenCalledWith(Phaser.Scenes.Events.SHUTDOWN, expect.any(Function));
    if (!continueCallback) throw new Error("movement_test_callback_missing");
    continueCallback(); await pending;
    expect(f.positions.at(-1)).toEqual({ x: 1, y: 0, z: 0 });
  });

  it("cancels once, releases the step, resolves and leaves the completion callback unused", async () => {
    const f = fixture(), onComplete = jest.fn(), onStop = jest.fn();
    const pending = f.tween.moveActorToTileWithTween({ x: 1, y: 0 }, undefined, onComplete, onStop);
    f.tween.cancelMovement(); f.tween.cancelMovement(); await pending;
    expect(onStop).toHaveBeenCalledTimes(1); expect(onComplete).not.toHaveBeenCalled();
    expect(f.events.off).toHaveBeenCalledTimes(2);
    expect(f.occupancy.releaseStep).toHaveBeenCalledWith("actor:1");
  });

  it("resolves through the original shutdown cancellation callback and removes both listeners", async () => {
    const f = fixture(), onStop = jest.fn(), onComplete = jest.fn();
    const pending = f.tween.moveActorToTileWithTween({ x: 1, y: 0 }, undefined, onComplete, onStop);
    const shutdown = f.events.once.mock.calls.find(([event]) => event === Phaser.Scenes.Events.SHUTDOWN);
    if (!shutdown || typeof shutdown[1] !== "function") throw new Error("movement_test_shutdown_missing");
    shutdown[1](); await pending;
    expect(onStop).toHaveBeenCalledTimes(1); expect(onComplete).not.toHaveBeenCalled();
    expect(f.events.off).toHaveBeenCalledTimes(2);
    expect(f.occupancy.releaseStep).toHaveBeenCalledWith("actor:1");
  });

  it("retains direct-flight distance and speed modifiers with no step reservation", async () => {
    const f = fixture(), onComplete = jest.fn();
    f.runtime.statusEffectComponent = { getMovementSpeedModifier: () => 0.5 } as never;
    const pending = f.tween.moveDirectlyToLocationWithoutPathfinding({ x: 4, y: 0, z: 2 }, { onComplete });
    jest.mocked(getInterpolatedSimulationNow).mockReturnValue(400); update(f);
    expect(f.positions.at(-1)).toEqual({ x: 2, y: 0, z: 1 });
    expect(f.occupancy.tryReserveStep).not.toHaveBeenCalled();
    jest.mocked(getInterpolatedSimulationNow).mockReturnValue(800); update(f); await pending;
    expect(f.positions.at(-1)).toEqual({ x: 4, y: 0, z: 2 });
    expect(onComplete).toHaveBeenCalledTimes(1); expect(f.animation).toHaveBeenCalledWith(false, { onComplete });
  });

  it("retains failed step admission before listeners and releases a step after native setup failure", async () => {
    const f = fixture(), tile = { x: 1, y: 0 };
    f.occupancy.tryReserveStep.mockReturnValueOnce({ reserved: false, blockers: ["actor:2"] });
    await expect(f.tween.moveActorToTileWithTween(tile)).rejects.toMatchObject(
      new MovementStepBlockedError(tile, ["actor:2"])
    );
    expect(f.events.on).not.toHaveBeenCalled(); expect(f.occupancy.releaseStep).not.toHaveBeenCalled();
    const lookup = jest.mocked(getActorComponent).getMockImplementation();
    jest.mocked(getActorComponent).mockImplementation((actor, component) => component === RepresentableComponent
      ? undefined : lookup?.(actor, component));
    await expect(f.tween.moveActorToTileWithTween(tile)).rejects.toBe("No representable component");
    expect(f.occupancy.releaseStep).toHaveBeenCalledTimes(1);
    expect(f.occupancy.releaseStep).toHaveBeenCalledWith("actor:1");
  });
});
