import Phaser from "phaser";
import { environment } from "@fuzzy-waddle/environments/environment";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";
import { readAiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config";
import { installAiRuntimeProductionCapture } from "./install-ai-runtime-production-capture";

jest.mock("@fuzzy-waddle/environments/environment", () => ({ environment: { production: false } }));
jest.mock("./ai-runtime-production-capture", () => ({ AiRuntimeProductionCapture: jest.fn() }));
jest.mock("./ai-runtime-browser-test-config", () => ({ readAiRuntimeBrowserTestConfigV1: jest.fn() }));

describe("installAiRuntimeProductionCapture", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    environment.production = false;
    delete window.__fuzzyWaddleAiRuntimeBrowserTestV1;
  });

  afterEach(() => {
    environment.production = false;
    delete window.__fuzzyWaddleAiRuntimeBrowserTestV1;
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
    window.__fuzzyWaddleAiRuntimeBrowserTestV1 = { schemaVersion: 1, config, game, initialStateByPlayer: {} };
    jest.mocked(readAiRuntimeBrowserTestConfigV1).mockReturnValue(config);
    environment.production = true;

    installAiRuntimeProductionCapture(scene);

    expect(readAiRuntimeBrowserTestConfigV1).not.toHaveBeenCalled();
    expect(AiRuntimeProductionCapture).not.toHaveBeenCalled();
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1.productionCapture).toBeUndefined();
    expect(events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(0);
    expect(events.listenerCount(Phaser.Scenes.Events.DESTROY)).toBe(0);
  });

  it("returns before reading test configuration when no matching marked game host exists", () => {
    const scene = { game: {}, events: new Phaser.Events.EventEmitter() } as unknown as ProbableWaffleScene;

    installAiRuntimeProductionCapture(scene);

    expect(readAiRuntimeBrowserTestConfigV1).not.toHaveBeenCalled();
    expect(AiRuntimeProductionCapture).not.toHaveBeenCalled();
  });

  it("requires the explicit marker and current game, installs once and detaches on direct scene destruction", () => {
    const events = new Phaser.Events.EventEmitter();
    const game = {} as Phaser.Game;
    const scene = { game, events } as unknown as ProbableWaffleScene;
    const config = { schemaVersion: 1 as const, enabled: true as const, seed: 1, startPaused: true as const };
    window.__fuzzyWaddleAiRuntimeBrowserTestV1 = { schemaVersion: 1, config, game, initialStateByPlayer: {} };
    jest.mocked(readAiRuntimeBrowserTestConfigV1).mockReturnValue(config);
    installAiRuntimeProductionCapture(scene);
    expect(AiRuntimeProductionCapture).not.toHaveBeenCalled();
    jest.mocked(readAiRuntimeBrowserTestConfigV1).mockReturnValue({ ...config, captureProduction: true });
    const capture = jest.fn();
    jest.mocked(AiRuntimeProductionCapture).mockImplementation(() => ({ capture }) as never);
    installAiRuntimeProductionCapture(scene);
    installAiRuntimeProductionCapture(scene);
    expect(AiRuntimeProductionCapture).toHaveBeenCalledTimes(1);
    window.__fuzzyWaddleAiRuntimeBrowserTestV1?.productionCapture?.capture(2);
    expect(capture).toHaveBeenCalledWith(2);
    events.emit(Phaser.Scenes.Events.DESTROY);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1?.productionCapture).toBeUndefined();
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
    jest.mocked(readAiRuntimeBrowserTestConfigV1).mockReturnValue(config);
    jest.mocked(AiRuntimeProductionCapture).mockImplementation(() => ({ capture: jest.fn() }) as never);
    window.__fuzzyWaddleAiRuntimeBrowserTestV1 = { schemaVersion: 1, config, game, initialStateByPlayer: {} };
    installAiRuntimeProductionCapture(scene);
    const original = window.__fuzzyWaddleAiRuntimeBrowserTestV1;
    if (!original) throw new Error("fixture_host_missing");
    const replacement = { ...original, game: {} as Phaser.Game, productionCapture: { capture: jest.fn() } };
    window.__fuzzyWaddleAiRuntimeBrowserTestV1 = replacement;
    events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(window.__fuzzyWaddleAiRuntimeBrowserTestV1).toBe(replacement);
  });
});
