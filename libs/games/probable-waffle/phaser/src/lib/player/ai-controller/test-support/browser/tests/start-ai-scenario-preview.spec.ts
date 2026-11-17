import type { ProbableWaffleScene } from "../../../../../core/probable-waffle.scene";
import { SimulationPauseReason } from "../../../../../world/services/simulation-pause-reason";
import type { SimulationTickService } from "../../../../../world/services/simulation-tick.service";
import { scheduleAiRuntimePresetSetup } from "../../presets/setup/schedule-ai-runtime-preset-setup";
import type { AiRuntimeBrowserTestHost } from "../ai-runtime-browser-test-host";
import { startAiScenarioPreview } from "../start-ai-scenario-preview";

jest.mock("../presets/setup/schedule-ai-runtime-preset-setup", () => ({ scheduleAiRuntimePresetSetup: jest.fn() }));

describe("interactive AI scenario startup", () => {
  const scene = { game: {} } as ProbableWaffleScene;
  const ticks = { resumeTick: jest.fn() };
  const scheduleSetup = jest.mocked(scheduleAiRuntimePresetSetup);

  beforeEach(() => jest.clearAllMocks());
  afterEach(() => { delete window.__fuzzyWaddleAiRuntimeBrowserTest; });

  it("resumes an interactive game only from its queued setup callback", () => {
    window.__fuzzyWaddleAiRuntimeBrowserTest = {
      game: scene.game, interactive: true, config: { schemaVersion: 1, enabled: true, startPaused: true, seed: 42 }
    } as AiRuntimeBrowserTestHost;
    startAiScenarioPreview(scene, ticks as unknown as SimulationTickService);
    expect(ticks.resumeTick).not.toHaveBeenCalled();
    scheduleSetup.mock.calls[0][1]();
    expect(ticks.resumeTick).toHaveBeenCalledWith(SimulationPauseReason.Manual);
  });

  it("leaves an automated game paused for its driver", () => {
    window.__fuzzyWaddleAiRuntimeBrowserTest = { game: scene.game } as AiRuntimeBrowserTestHost;
    startAiScenarioPreview(scene, ticks as unknown as SimulationTickService);
    expect(scheduleSetup).not.toHaveBeenCalled();
    expect(ticks.resumeTick).not.toHaveBeenCalled();
  });
});
