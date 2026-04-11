import { filter, type Subscription } from "rxjs";
import type { PlayerLobbyDefinition, PositionPlayerDefinition } from "@fuzzy-waddle/api-interfaces";
import { getCommunicator } from "../../data/scene-data";
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
 *   3. Player chooses Wait (resume) or Kick (remove the desynced player and
 *      resume).
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
    simTick?.pauseTick("desync");

    this.lastPauseMs = Date.now();
    this.pauseCount++;
    this.dialogOpen = true;

    const dialog = SceneDialogHelper.showDialog<DesyncRecoveryDialog>(hudScene, "DesyncRecoveryDialog");
    dialog.setup({
      tick: data.tick,
      playerNumber: data.remotePlayerNumber,
      onWait: () => {
        simTick?.resumeTick("desync");
        this.dialogOpen = false;
      },
      onKick: () => {
        console.warn(`[DESYNC] Removing player ${data.remotePlayerNumber} after desync at tick ${data.tick}.`);
        getCommunicator(probableWaffleScene).playerChanged?.send({
          gameInstanceId: probableWaffleScene.gameInstanceId,
          emitterUserId: probableWaffleScene.userId,
          property: "left",
          data: {
            playerControllerData: {
              playerDefinition: {
                player: {
                  playerNumber: data.remotePlayerNumber
                } as PlayerLobbyDefinition
              } as PositionPlayerDefinition
            }
          }
        });
        simTick?.resumeTick("desync");
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
