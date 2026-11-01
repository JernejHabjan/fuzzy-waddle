import { environment } from "@fuzzy-waddle/environments/environment";
import Phaser from "phaser";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";
import { AiRuntimeMovementOnlyCapture } from "./ai-runtime-movement-only-capture";
import { readAiRuntimeBrowserTestConfig } from "./ai-runtime-browser-test-config";

/** Installs before preset money/work is applied. Ordinary scenes and unmarked developer worlds have no observer. */
export function installAiRuntimeProductionCapture(scene: ProbableWaffleScene): void {
  if (environment.production || typeof window === "undefined") return;
  const host = window.__fuzzyWaddleAiRuntimeBrowserTest;
  if (!host || host.game !== scene.game || host.productionCapture) return;
  const config = readAiRuntimeBrowserTestConfig();
  if (!config?.captureProduction) return;
  const capture = config.captureMovementOnly
    ? new AiRuntimeMovementOnlyCapture(scene)
    : new AiRuntimeProductionCapture(scene, [], config.presetWorld?.protectedRoutes, config.captureCombat === true);
  const handle = {
    capture: (playerNumber: number, latestTick?: number) => capture.capture(playerNumber, latestTick),
    captureHuman: (playerNumber: number, latestTick?: number) => capture.captureHumanQueueBoundary(playerNumber, latestTick)
  };
  window.__fuzzyWaddleAiRuntimeBrowserTest = { ...host, productionCapture: handle };
  const detach = () => {
    const current = window.__fuzzyWaddleAiRuntimeBrowserTest;
    if (current?.productionCapture === handle) {
      const { productionCapture, ...remaining } = current;
      void productionCapture;
      window.__fuzzyWaddleAiRuntimeBrowserTest = remaining;
    }
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, detach);
    scene.events.off(Phaser.Scenes.Events.DESTROY, detach);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, detach);
  scene.events.once(Phaser.Scenes.Events.DESTROY, detach);
}
