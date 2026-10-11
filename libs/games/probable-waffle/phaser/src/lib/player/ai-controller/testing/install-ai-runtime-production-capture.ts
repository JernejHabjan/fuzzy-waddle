import { environment } from "@fuzzy-waddle/environments/environment";
import Phaser from "phaser";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";
import { readAiRuntimeBrowserTestConfigV1 } from "./ai-runtime-browser-test-config";

/** Installs before preset money/work is applied. Ordinary scenes and unmarked developer worlds have no observer. */
export function installAiRuntimeProductionCapture(scene: ProbableWaffleScene): void {
  if (environment.production || typeof window === "undefined") return;
  const host = window.__fuzzyWaddleAiRuntimeBrowserTestV1;
  if (!host || host.game !== scene.game || host.productionCapture) return;
  if (!readAiRuntimeBrowserTestConfigV1()?.captureProduction) return;
  const capture = new AiRuntimeProductionCapture(scene);
  const handle = { capture: (playerNumber: number) => capture.capture(playerNumber) };
  window.__fuzzyWaddleAiRuntimeBrowserTestV1 = { ...host, productionCapture: handle };
  const detach = () => {
    const current = window.__fuzzyWaddleAiRuntimeBrowserTestV1;
    if (current?.productionCapture === handle) {
      const { productionCapture, ...remaining } = current;
      void productionCapture;
      window.__fuzzyWaddleAiRuntimeBrowserTestV1 = remaining;
    }
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, detach);
    scene.events.off(Phaser.Scenes.Events.DESTROY, detach);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, detach);
  scene.events.once(Phaser.Scenes.Events.DESTROY, detach);
}
