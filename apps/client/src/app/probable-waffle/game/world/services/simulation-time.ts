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

/**
 * A cancellable simulation-time delay that replaces `scene.time.delayedCall` for
 * simulation-affecting callbacks (damage application, projectile spawning, etc.).
 *
 * Unlike `scene.time.delayedCall` which uses wall-clock time, this fires when the
 * simulation clock — driven by SimulationTickService — has advanced by `durationMs`.
 * This guarantees all clients fire the callback at the same simulation tick, even
 * if they are running at different render frame rates.
 *
 * Usage:
 *   this.timer = new CancelableSimDelay(scene, 500, () => applyDamage());
 *   this.timer.remove(); // cancel before it fires
 */
export class CancelableSimDelay {
  private cancelled = false;

  constructor(scene: Phaser.Scene, durationMs: number, callback: () => void) {
    waitForSimulationDuration(scene, durationMs).then(() => {
      if (!this.cancelled) {
        callback();
      }
    });
  }

  /** Cancel the pending callback. Safe to call multiple times. */
  remove(): void {
    this.cancelled = true;
  }
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
    const tickSubscription = tickService.tick$.subscribe((tick) => {
      if (tick * SimulationTickService.TICK_INTERVAL_MS < targetTime) {
        return;
      }

      cleanup();
      resolve();
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, shutdownHandler);
  });
}
