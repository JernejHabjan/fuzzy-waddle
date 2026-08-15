import Phaser from "phaser";
import { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { GameOptionsService } from "../../../core/game-options.service";
import { getSceneExternalComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";

/** Scene-backed local diagnostics projection owned by the main Probable Waffle HUD. */
export default class HudDiagnostics extends Phaser.GameObjects.Container {
  private readonly metricsText: Phaser.GameObjects.Text;
  private readonly subscriptions: Subscription[] = [];
  private readonly localActionTicks: number[] = [];
  private parentScene?: ProbableWaffleScene;
  private roundTripTimeMs: number | null = null;
  private lastRefreshAt = Number.NEGATIVE_INFINITY;

  constructor(scene: Phaser.Scene, x = 0, y = 0) {
    super(scene, x, y);
    this.metricsText = scene.add
      .text(0, 0, "", {
        align: "right",
        color: "#ffffff",
        fontFamily: "disposabledroid",
        fontSize: "16px",
        resolution: 10,
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(1, 0);
    this.add(this.metricsText);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateProjection, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Connects local diagnostics to the parent game without mutating deterministic state. */
  setup(parentScene: ProbableWaffleScene): void {
    this.parentScene = parentScene;
    const commandBus = getSceneService(parentScene, CommandBusService);
    if (commandBus) {
      this.subscriptions.push(
        commandBus.commandBatch$.subscribe((batch) => {
          if (batch.playerNumber !== parentScene.player.playerNumber) return;
          for (let index = 0; index < batch.commands.length; index++) this.localActionTicks.push(batch.tick);
        }),
        commandBus.roundTripTimeMs$.subscribe((roundTripTimeMs) => (this.roundTripTimeMs = roundTripTimeMs))
      );
    }
    const options = getSceneExternalComponent(parentScene, GameOptionsService);
    if (options) this.subscriptions.push(options.settingsChanged.subscribe(() => this.updateProjection(0, 0, true)));
    this.updateProjection(0, 0, true);
  }

  private updateProjection(time: number, _delta: number, force = false): void {
    if (!this.parentScene || (!force && time - this.lastRefreshAt < 250)) return;
    this.lastRefreshAt = time;
    const options = getSceneExternalComponent(this.parentScene, GameOptionsService)?.gameSettings;
    const tickService = getSceneService(this.parentScene, SimulationTickService);
    if (!options || !tickService) return;
    const cutoffTick = Math.max(0, tickService.currentTick - 60_000 / SimulationTickService.TICK_INTERVAL_MS);
    while ((this.localActionTicks[0] ?? Number.POSITIVE_INFINITY) < cutoffTick) this.localActionTicks.shift();
    const lines: string[] = [];
    if (options.showPing) {
      lines.push(`Ping: ${this.roundTripTimeMs == null ? "N/A" : `${Math.round(this.roundTripTimeMs)} ms`}`);
    }
    if (options.showActionsPerMinute)
      lines.push(`APM: ${countRollingActions(this.localActionTicks, tickService.currentTick)}`);
    if (options.showFps) lines.push(`FPS: ${Math.round(this.scene.game.loop.actualFps)}`);
    if (options.showTimeElapsed) lines.push(`Time: ${formatElapsed(tickService.currentTick)}`);
    this.metricsText.setText(lines);
    this.visible = lines.length > 0;
  }

  override destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateProjection, this);
    for (const subscription of this.subscriptions) subscription.unsubscribe();
    this.subscriptions.length = 0;
    super.destroy();
  }
}

export function countRollingActions(actionTicks: readonly number[], currentTick: number): number {
  const cutoffTick = Math.max(0, currentTick - 60_000 / SimulationTickService.TICK_INTERVAL_MS);
  return actionTicks.filter((tick) => tick >= cutoffTick && tick <= currentTick).length;
}

export function formatElapsed(tick: number): string {
  const seconds = Math.floor((tick * SimulationTickService.TICK_INTERVAL_MS) / 1000);
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
