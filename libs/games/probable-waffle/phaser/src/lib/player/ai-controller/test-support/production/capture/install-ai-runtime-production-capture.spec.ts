import Phaser from "phaser";
import { environment } from "@fuzzy-waddle/environments/environment";
import type { ProbableWaffleScene } from "../../../../../core/probable-waffle.scene";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";
import { readAiRuntimeBrowserTestConfig } from "../../browser/ai-runtime-browser-test-config";
import { installAiRuntimeProductionCapture } from "./install-ai-runtime-production-capture";

jest.mock("@fuzzy-waddle/environments/environment", () => ({ environment: { production: false } }));
jest.mock("./ai-runtime-production-capture", () => ({ AiRuntimeProductionCapture: jest.fn() }));
jest.mock("../../browser/ai-runtime-browser-test-config", () => ({ readAiRuntimeBrowserTestConfig: jest.fn() }));

describe("installAiRuntimeProductionCapture", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    environment.production = false;
    delete window.__fuzzyWaddleAiRuntimeBrowserTest;
  });

  afterEach(() => {
    environment.production = false;
    delete window.__fuzzyWaddleAiRuntimeBrowserTest;
  });

  it("installs no capture or teardown listeners in production even with a matching marked host", () => {
    const events = new Phaser.Events.EventEmitter();
    const game = {} as Phaser.Game;
    const scene = { game, events } as unknown as ProbableWaffleScene;
    const config = {
      schemaVersion: 1 as const,
      enabled: true as const,
      seed: 1,
      startPaused: true as const,
      captureProduction: true as const
    };
    window.__fuzzyWaddleAiRuntimeBrowserTest = { schemaVersion: 1, config, game, initialStateByPlayer: {} };
    jest.mocked(readAiRuntimeBrowserTestConfig).mockReturnValue(config);
    environment.production = true;

    installAiRuntimeProductionCapture(scene);

    expect(readAiRuntimeBrowserTestConfig).not.toHaveBeenCalled();
    expect(AiRuntimeProductionCapture).not.toHaveBeenCalled();
    expect(window.__fuzzyWaddleAiRuntimeBrowserTest.productionCapture).toBeUndefined();
    expect(events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(0);
    expect(events.listenerCount(Phaser.Scenes.Events.DESTROY)).toBe(0);
  });

  it("returns before reading test configuration when no matching marked game host exists", () => {
    const scene = { game: {}, events: new Phaser.Events.EventEmitter() } as unknown as ProbableWaffleScene;

    installAiRuntimeProductionCapture(scene);

    expect(readAiRuntimeBrowserTestConfig).not.toHaveBeenCalled();
    expect(AiRuntimeProductionCapture).not.toHaveBeenCalled();
  });

  it("requires the explicit marker and current game, installs once and detaches on direct scene destruction", () => {
    const events = new Phaser.Events.EventEmitter();
    const game = {} as Phaser.Game;
    const scene = { game, events } as unknown as ProbableWaffleScene;
    const config = { schemaVersion: 1 as const, enabled: true as const, seed: 1, startPaused: true as const };
    window.__fuzzyWaddleAiRuntimeBrowserTest = { schemaVersion: 1, config, game, initialStateByPlayer: {} };
    jest.mocked(readAiRuntimeBrowserTestConfig).mockReturnValue(config);
    installAiRuntimeProductionCapture(scene);
    expect(AiRuntimeProductionCapture).not.toHaveBeenCalled();
    jest.mocked(readAiRuntimeBrowserTestConfig).mockReturnValue({ ...config, captureProduction: true });
    const capture = jest.fn(), captureHumanQueueBoundary = jest.fn();
    jest.mocked(AiRuntimeProductionCapture).mockImplementation(() => ({ capture, captureHumanQueueBoundary }) as never);
    installAiRuntimeProductionCapture(scene);
    installAiRuntimeProductionCapture(scene);
    expect(AiRuntimeProductionCapture).toHaveBeenCalledTimes(1);
    expect(AiRuntimeProductionCapture).toHaveBeenCalledWith(scene, [], undefined, false);
    window.__fuzzyWaddleAiRuntimeBrowserTest?.productionCapture?.capture(2);
    expect(capture).toHaveBeenCalledWith(2, undefined);
    window.__fuzzyWaddleAiRuntimeBrowserTest?.productionCapture?.capture(2, 400);
    expect(capture).toHaveBeenLastCalledWith(2, 400);
    window.__fuzzyWaddleAiRuntimeBrowserTest?.productionCapture?.captureHuman?.(1, 400);
    expect(captureHumanQueueBoundary).toHaveBeenCalledWith(1, 400);
    events.emit(Phaser.Scenes.Events.DESTROY);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTest?.productionCapture).toBeUndefined();
  });

  it("leaves a replacement game's handle attached when the old scene shuts down", () => {
    const events = new Phaser.Events.EventEmitter();
    const game = {} as Phaser.Game;
    const scene = { game, events } as unknown as ProbableWaffleScene;
    const config = {
      schemaVersion: 1 as const,
      enabled: true as const,
      seed: 1,
      startPaused: true as const,
      captureProduction: true as const
    };
    jest.mocked(readAiRuntimeBrowserTestConfig).mockReturnValue(config);
    jest.mocked(AiRuntimeProductionCapture).mockImplementation(() => ({ capture: jest.fn() }) as never);
    window.__fuzzyWaddleAiRuntimeBrowserTest = { schemaVersion: 1, config, game, initialStateByPlayer: {} };
    installAiRuntimeProductionCapture(scene);
    const original = window.__fuzzyWaddleAiRuntimeBrowserTest;
    if (!original) throw new Error("fixture_host_missing");
    const replacement = { ...original, game: {} as Phaser.Game, productionCapture: { capture: jest.fn() } };
    window.__fuzzyWaddleAiRuntimeBrowserTest = replacement;
    events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTest).toBe(replacement);
  });

  it("forwards native combat opt-in only to the existing capture", () => {
    const game = {} as Phaser.Game;
    const scene = { game, events: new Phaser.Events.EventEmitter() } as unknown as ProbableWaffleScene;
    const config = { schemaVersion: 1 as const, enabled: true as const, seed: 1, startPaused: true as const,
      captureProduction: true as const, captureCombat: true as const };
    window.__fuzzyWaddleAiRuntimeBrowserTest = { schemaVersion: 1, config, game, initialStateByPlayer: {} };
    jest.mocked(readAiRuntimeBrowserTestConfig).mockReturnValue(config);
    jest.mocked(AiRuntimeProductionCapture).mockImplementation(() => ({ capture: jest.fn() }) as never);
    installAiRuntimeProductionCapture(scene);
    expect(AiRuntimeProductionCapture).toHaveBeenCalledWith(scene, [], undefined, true);
  });
});
