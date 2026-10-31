import Phaser from "phaser";
import { BehaviorSubject } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneInitializers, getSceneService } from "../../../world/services/scene-component-helpers";
import { isSceneActive } from "../../../data/game-object-helper";
import { scheduleAiRuntimePresetSetup } from "./schedule-ai-runtime-preset-setup";
import { AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1 } from "./ai-runtime-browser-test-config";

jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneInitializers: jest.fn(), getSceneService: jest.fn()
}));
jest.mock("../../../data/game-object-helper", () => ({ isSceneActive: jest.fn() }));

function setup() {
  const ready = new BehaviorSubject(false);
  const timer = { remove: jest.fn() };
  let callback: (() => void) | undefined;
  const delayedCall = jest.fn((_delay: number, action: () => void) => { callback = action; return timer; });
  const game = {} as Phaser.Game;
  const events = new Phaser.Events.EventEmitter();
  const scene = { game, events, time: { delayedCall } } as unknown as ProbableWaffleScene;
  const ticks = { currentTick: 0, isPaused: true };
  jest.mocked(getSceneInitializers).mockReturnValue({ sceneInitialized: ready } as never);
  jest.mocked(getSceneService).mockReturnValue(ticks as never);
  jest.mocked(isSceneActive).mockReturnValue(true);
  window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1] = { schemaVersion: 1, game, initialStateByPlayer: {},
    config: { schemaVersion: 1, enabled: true, startPaused: true, seed: 1 } };
  const apply = jest.fn();
  scheduleAiRuntimePresetSetup(scene, apply);
  const run = () => { if (!callback) throw new Error("test_timer_missing"); callback(); };
  return { ready, timer, delayedCall, events, ticks, apply, run };
}

afterEach(() => { delete window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1]; });

it("waits for the scene-ready signal and earlier initialization timers before applying once at paused tick zero", () => {
  const f = setup();
  expect(f.delayedCall).not.toHaveBeenCalled();
  f.ready.next(true);
  expect(f.delayedCall).toHaveBeenCalledTimes(1);
  expect(f.apply).not.toHaveBeenCalled();
  f.run();
  f.run();
  expect(f.apply).toHaveBeenCalledTimes(1);
  expect(f.ready.observed).toBe(false);
  expect(f.events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(0);
});

it("disposes both readiness subscriptions and pending timers on either teardown event", () => {
  for (const event of [Phaser.Scenes.Events.SHUTDOWN, Phaser.Scenes.Events.DESTROY]) {
    const beforeReady = setup();
    beforeReady.events.emit(event);
    beforeReady.ready.next(true);
    expect(beforeReady.delayedCall).not.toHaveBeenCalled();
    expect(beforeReady.ready.observed).toBe(false);
    const pending = setup();
    pending.ready.next(true);
    pending.events.emit(event);
    pending.run();
    expect(pending.timer.remove).toHaveBeenCalledWith(false);
    expect(pending.apply).not.toHaveBeenCalled();
  }
});

it("fences replaced/inactive games and rejects a clock that advanced or resumed before setup", () => {
  const replaced = setup();
  replaced.ready.next(true);
  delete window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1];
  replaced.run();
  expect(replaced.apply).not.toHaveBeenCalled();
  const inactive = setup();
  inactive.ready.next(true);
  jest.mocked(isSceneActive).mockReturnValue(false);
  inactive.run();
  expect(inactive.apply).not.toHaveBeenCalled();
  for (const fault of ["advanced", "resumed"]) {
    const f = setup();
    f.ready.next(true);
    if (fault === "advanced") f.ticks.currentTick = 1;
    else f.ticks.isPaused = false;
    expect(f.run).toThrow("runtime_preset_setup_tick_zero_required");
    expect(f.apply).not.toHaveBeenCalled();
    expect(f.ready.observed).toBe(false);
  }
});
