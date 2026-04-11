import { filter, type Subscription } from "rxjs";
import { getSceneService } from "./scene-component-helpers";
import { SimulationTickService } from "./simulation-tick.service";
import { SceneDialogHelper } from "../scenes/scene-dialog-helper";
import type DesyncRecoveryDialog from "../scenes/hud-scenes/DesyncRecoveryDialog";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import type { DesyncDetectedEvent } from "./state-hash.service";

/**
 * Handles the desync recovery flow triggered by StateHashService.
 *
 * Flow:
 *   1. "desync-detected" arrives on allScenes.
 *   2. After GRACE_PERIOD_MS a recovery pause + dialog is triggered (unless suppressed by
 *      anti-grief rules).
 *   3. Player chooses Wait (resume) or Kick (log + resume; actual kick networking wired in
 *      step 12 when the disconnect/reconnect system is in place).
 *
 * Anti-grief:
 *   - At most 1 forced pause every MIN_PAUSE_INTERVAL_MS (60 s).
 *   - At most MAX_PAUSES_PER_MATCH (3) over the entire session.
 */
export class DesyncRecoveryService {
  /** Pause is triggered this many ms after the first desync event. */
  private static readonly GRACE_PERIOD_MS = 5_000;
  /**
   * Minimum gap between two consecutive forced pauses.
   * Prevents rapid-fire dialogs if the simulation is already badly desynced.
   */
  private static readonly MIN_PAUSE_INTERVAL_MS = 60_000;
  /** After this many pauses the recovery flow silently stops; logging continues. */
  private static readonly MAX_PAUSES_PER_MATCH = 3;

  private gracePeriodHandle?: ReturnType<typeof setTimeout>;
  private lastPauseMs = 0;
  private pauseCount = 0;
  /** True while the dialog is visible (prevents opening a second dialog). */
  private dialogOpen = false;
  private sub?: Subscription;

  init(hudScene: Phaser.Scene, probableWaffleScene: ProbableWaffleScene): void {
    this.sub = probableWaffleScene.communicator.allScenes
      .pipe(filter((e) => e.name === "desync-detected"))
      .subscribe((e) => {
        const data = e.data as DesyncDetectedEvent;
        this.onDesyncDetected(data, hudScene, probableWaffleScene);
      });
  }

  private onDesyncDetected(
    data: DesyncDetectedEvent,
    hudScene: Phaser.Scene,
    probableWaffleScene: ProbableWaffleScene
  ): void {
    // A grace period timer is already running for a previous desync — do nothing.
    if (this.gracePeriodHandle !== undefined || this.dialogOpen) return;

    if (this.pauseCount >= DesyncRecoveryService.MAX_PAUSES_PER_MATCH) {
      // Anti-grief cap reached; desync is still being logged by StateHashService.
      return;
    }

    const now = Date.now();
    if (now - this.lastPauseMs < DesyncRecoveryService.MIN_PAUSE_INTERVAL_MS) {
      // Too soon since the last pause.
      return;
    }

    this.gracePeriodHandle = setTimeout(() => {
      this.gracePeriodHandle = undefined;
      this.triggerRecovery(data, hudScene, probableWaffleScene);
    }, DesyncRecoveryService.GRACE_PERIOD_MS);
  }

  private triggerRecovery(
    data: DesyncDetectedEvent,
    hudScene: Phaser.Scene,
    probableWaffleScene: ProbableWaffleScene
  ): void {
    const simTick = getSceneService(probableWaffleScene, SimulationTickService);
    simTick?.pauseTick();

    this.lastPauseMs = Date.now();
    this.pauseCount++;
    this.dialogOpen = true;

    const dialog = SceneDialogHelper.showDialog<DesyncRecoveryDialog>(hudScene, "DesyncRecoveryDialog");
    dialog.setup({
      tick: data.tick,
      playerNumber: data.remotePlayerNumber,
      onWait: () => {
        simTick?.resumeTick();
        this.dialogOpen = false;
      },
      onKick: () => {
        // TODO (step 12): send a kick/remove-player event via communicator once the
        // disconnect/reconnect system is in place. For now just resume so the game continues.
        console.warn(
          `[DESYNC] Kick requested for player ${data.remotePlayerNumber} at tick ${data.tick}. ` +
            `Reconnect/kick networking not yet implemented.`
        );
        simTick?.resumeTick();
        this.dialogOpen = false;
      }
    });
  }

  destroy(): void {
    if (this.gracePeriodHandle !== undefined) {
      clearTimeout(this.gracePeriodHandle);
      this.gracePeriodHandle = undefined;
    }
    this.sub?.unsubscribe();
  }
}
