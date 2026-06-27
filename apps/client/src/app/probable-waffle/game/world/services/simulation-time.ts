import { getSceneService } from "./scene-component-helpers";
import { SimulationTickService } from "./simulation-tick.service";

export function getSimulationNow(scene: Phaser.Scene | undefined | null): number {
  const tickService = tryGetSimulationTickService(scene);
  if (!tickService) {
    return scene?.time.now ?? Date.now();
  }

  return tickService.currentTick * SimulationTickService.TICK_INTERVAL_MS;
}

export function getInterpolatedSimulationNow(scene: Phaser.Scene | undefined | null): number {
  const tickService = tryGetSimulationTickService(scene);
  if (!tickService) {
    return scene?.time.now ?? Date.now();
  }

  return tickService.getInterpolatedTimeMs();
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

  /**
   * Schedules `callback` against deterministic simulation time when available.
   * The fallback path is intentionally wall-clock based for menus, tests, or HUD
   * scenes that do not register SimulationTickService.
   */
  constructor(scene: Phaser.Scene | undefined | null, durationMs: number, callback: () => void) {
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

/**
 * Resolves after `durationMs` of simulation time. Multiplayer lockstep pauses
 * stop this clock, so gameplay callbacks do not drift ahead while waiting for
 * peers, reconnect snapshots, or player pauses.
 */
export function waitForSimulationDuration(scene: Phaser.Scene | undefined | null, durationMs: number): Promise<void> {
  const tickService = tryGetSimulationTickService(scene);
  if (!tickService) {
    return new Promise<void>((resolve) => {
      // Intentional wall-clock fallback for scenes that do not run SimulationTickService.
      if (!scene) {
        setTimeout(() => resolve(), durationMs);
        return;
      }
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
      scene?.events.off(Phaser.Scenes.Events.SHUTDOWN, shutdownHandler);
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

    scene?.events.once(Phaser.Scenes.Events.SHUTDOWN, shutdownHandler);
  });
}

function tryGetSimulationTickService(scene: Phaser.Scene | undefined | null): SimulationTickService | undefined {
  if (!scene) return undefined;
  if (!scene.scene || !scene.scene.isActive()) return undefined;
  return getSceneService(scene, SimulationTickService);
}
