import Phaser from "phaser";
import { filter, Subscription, take } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneInitializers, getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { isSceneActive } from "../../../data/game-object-helper";
import { AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1 } from "./ai-runtime-browser-test-config";

/** Runs once after earlier object-ready timers, while the marked scene remains paused at tick zero. */
export function scheduleAiRuntimePresetSetup(scene: ProbableWaffleScene, apply: () => void): void {
  const subscriptions = new Subscription();
  let timer: Phaser.Time.TimerEvent | undefined;
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    subscriptions.unsubscribe();
    timer?.remove(false);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    scene.events.off(Phaser.Scenes.Events.DESTROY, cleanup);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
  subscriptions.add(getSceneInitializers(scene).sceneInitialized.pipe(filter((ready) => ready), take(1)).subscribe(() => {
    // Component subscriptions precede this subscriber; their zero-delay initialization timers are already queued.
    timer = scene.time.delayedCall(0, () => {
      if (disposed) return;
      const ticks = getSceneService(scene, SimulationTickService);
      const currentGame = window[AI_RUNTIME_BROWSER_TEST_HOST_KEY_V1]?.game;
      cleanup();
      if (currentGame !== scene.game || !isSceneActive(scene)) return;
      if (!ticks || ticks.currentTick !== 0 || !ticks.isPaused) throw new Error("runtime_preset_setup_tick_zero_required");
      apply();
    });
  }));
}
