import { Subject } from "rxjs";
import Phaser from "phaser";

import { SimulationPauseReason } from "./simulation-pause-reason";
export { SimulationPauseReason } from "./simulation-pause-reason";

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
  /** Documents the following declaration and its compatibility contract. */
  static readonly TICK_INTERVAL_MS = 50;

  /** Documents the following declaration and its compatibility contract. */
  currentTick = 0;

  /** Documents the following declaration and its compatibility contract. */
  readonly tick$ = new Subject<number>();

  private accumulated = 0;
  private readonly pauseReasons = new Set<SimulationPauseReason>();
  private simulationTimeScale = 1;
  private frontierObserver?: { close: (capturedAtTick: number) => void; lost: (reason: string) => void };

  /** Test-owned observer runs after increment, before next-tick subscribers. Failure detaches without stopping gameplay. */
  observeClosedFrontiers(close: (capturedAtTick: number) => void, lost: (reason: string) => void): () => void {
    if (this.frontierObserver) throw new Error("simulation_frontier_observer_already_installed");
    const observer = { close, lost };
    this.frontierObserver = observer;
    return () => {
      if (this.frontierObserver === observer) this.frontierObserver = undefined;
    };
  }

  private loseFrontier(reason: string): void {
    const observer = this.frontierObserver;
    this.frontierObserver = undefined;
    try {
      observer?.lost(reason);
    } catch {
      /* Diagnostic failure cannot change simulation progress. */
    }
  }

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdateFrameNonDeterministic, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Documents the pause tick member and its declared contract at this boundary. */
  pauseTick(reason: SimulationPauseReason = SimulationPauseReason.Manual): void {
    this.pauseReasons.add(reason);
  }

  /** Documents the resume tick member and its declared contract at this boundary. */
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
      this.loseFrontier("simulation_clock_fast_forward");
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
      try {
        this.frontierObserver?.close(this.currentTick);
      } catch {
        this.loseFrontier("simulation_frontier_listener_failed");
      }
      this.tick$.next(this.currentTick);
    }
  }

  private destroy(): void {
    this.loseFrontier("simulation_clock_shutdown");
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdateFrameNonDeterministic, this);
    this.tick$.complete();
    this.currentTick = 0;
    this.accumulated = 0;
    this.pauseReasons.clear();
  }
}
