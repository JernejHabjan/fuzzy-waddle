import { getSceneService } from "./scene-component-helpers";
import { SimulationTickService } from "./simulation-tick.service";

export function getSimulationNow(scene: Phaser.Scene): number {
  const tickService = getSceneService(scene, SimulationTickService);
  if (!tickService) {
    return scene.time.now;
  }

  return tickService.currentTick * SimulationTickService.TICK_INTERVAL_MS;
}

export function getSimulationDelta(
  scene: Phaser.Scene,
  lastSimulationTimeMs: number | undefined
): { now: number; delta: number } {
  const now = getSimulationNow(scene);
  if (lastSimulationTimeMs === undefined) {
    return { now, delta: 0 };
  }

  return { now, delta: Math.max(0, now - lastSimulationTimeMs) };
}

export function waitForSimulationDuration(scene: Phaser.Scene, durationMs: number): Promise<void> {
  const tickService = getSceneService(scene, SimulationTickService);
  if (!tickService) {
    return new Promise<void>((resolve) => {
      scene.time.delayedCall(durationMs, () => resolve());
    });
  }

  const targetTime = getSimulationNow(scene) + durationMs;
  if (getSimulationNow(scene) >= targetTime) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let settled = false;
    let tickSubscription: { unsubscribe(): void } | undefined;
    const cleanup = () => {
      if (settled) {
        return;
      }
      settled = true;
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, shutdownHandler);
      tickSubscription?.unsubscribe();
    };
    const shutdownHandler = () => {
      cleanup();
      resolve();
    };
    tickSubscription = tickService.tick$.subscribe((tick) => {
      if (tick * SimulationTickService.TICK_INTERVAL_MS < targetTime) {
        return;
      }

      cleanup();
      resolve();
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, shutdownHandler);
  });
}
