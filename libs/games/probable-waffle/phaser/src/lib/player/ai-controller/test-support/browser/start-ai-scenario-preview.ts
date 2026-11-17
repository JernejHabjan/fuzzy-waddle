import type { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { SimulationPauseReason } from "../../../../world/services/simulation-pause-reason";
import type { SimulationTickService } from "../../../../world/services/simulation-tick.service";
import { scheduleAiRuntimePresetSetup } from "../presets/setup/schedule-ai-runtime-preset-setup";

/** Queues playback behind preset setup so tick zero always uses the fully installed world. */
export function startAiScenarioPreview(scene: ProbableWaffleScene, ticks: SimulationTickService): void {
  const host = window.__fuzzyWaddleAiRuntimeBrowserTest;
  if (!host?.interactive || host.game !== scene.game) return;
  scheduleAiRuntimePresetSetup(scene, () => {
    const current = window.__fuzzyWaddleAiRuntimeBrowserTest;
    if (host.config.presetWorld && current?.presetApplication?.fixtureId !== host.config.presetWorld.fixtureId) return;
    ticks.resumeTick(SimulationPauseReason.Manual);
  });
}
