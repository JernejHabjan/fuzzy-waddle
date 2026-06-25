import { Subject } from "rxjs";
import Phaser from "phaser";

export enum SimulationPauseReason {
  Manual = "manual",
  SceneBootstrap = "scene-bootstrap",
  Lockstep = "lockstep",
  Reconnect = "reconnect",
  SnapshotRestore = "snapshot-restore",
  Desync = "desync",
  DesyncCorrection = "desync-correction",
  Player = "player"
}

/**
 * Drives the deterministic simulation at a fixed 20 Hz tick rate.
 *
 * The tick counter is the authoritative clock for the simulation.
 * Rendering runs at the native frame rate; simulation advances in
 * discrete steps of TICK_INTERVAL_MS regardless of frame rate.
 *
 * In single-player the tick advances every time enough real time has
 * elapsed (no coordination needed). In multiplayer (step 6), the
 * CommandBusService can call pauseTick / resumeTick to stall the
 * counter until all players' commands for the next tick have arrived.
 */
export class SimulationTickService {
  /** 20 Hz — one simulation step every 50 ms */
  static readonly TICK_INTERVAL_MS = 50;

  /** Total simulation ticks elapsed since the game started. */
  currentTick = 0;

  /** Fires with the new tick number each time the simulation advances. */
  readonly tick$ = new Subject<number>();

  private accumulated = 0;
  private readonly pauseReasons = new Set<SimulationPauseReason>();
  private simulationTimeScale = 1;

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdateFrameNonDeterministic, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Called by CommandBusService in multiplayer when waiting for peers. */
  pauseTick(reason: SimulationPauseReason = SimulationPauseReason.Manual): void {
    this.pauseReasons.add(reason);
  }

  /** Called by CommandBusService when all peers' commands are buffered. */
  resumeTick(reason: SimulationPauseReason = SimulationPauseReason.Manual): void {
    this.pauseReasons.delete(reason);
  }

  get isPaused(): boolean {
    return this.pauseReasons.size > 0;
  }

  getPauseReasons(): SimulationPauseReason[] {
    return [...this.pauseReasons].sort();
  }

  /**
   * Smooth simulation time for render-side interpolation.
   *
   * Deterministic gameplay should still use `tick$` / `currentTick`. This value is
   * for visuals that must freeze with lockstep pauses instead of continuing on
   * wall-clock time and overshooting the authoritative simulation frontier.
   */
  getInterpolatedTimeMs(): number {
    return this.currentTick * SimulationTickService.TICK_INTERVAL_MS + this.accumulated;
  }

  /**
   * Scales how quickly simulation ticks advance relative to wall-clock frame delta.
   * Used by single-player speed controls; multiplayer should remain at 1x lockstep.
   */
  setSimulationTimeScale(scale: number): void {
    if (!Number.isFinite(scale) || scale <= 0) {
      this.simulationTimeScale = 1;
      return;
    }
    this.simulationTimeScale = scale;
  }

  /**
   * Jump the sim clock to `tick` without emitting intermediate tick events.
   * Used after applying a reconnect snapshot so the command sequence stays coherent.
   */
  fastForwardTo(tick: number): void {
    if (tick > this.currentTick) {
      this.currentTick = tick;
      this.accumulated = 0;
    }
  }

  private onUpdateFrameNonDeterministic(_time: number, delta: number): void {
    if (this.isPaused) return;
    this.accumulated += delta * this.simulationTimeScale;
    while (this.accumulated >= SimulationTickService.TICK_INTERVAL_MS) {
      this.accumulated -= SimulationTickService.TICK_INTERVAL_MS;
      this.currentTick++;
      this.tick$.next(this.currentTick);
    }
  }

  private destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdateFrameNonDeterministic, this);
    this.tick$.complete();
    this.currentTick = 0;
    this.accumulated = 0;
    this.pauseReasons.clear();
  }
}
