import type { Subscription } from "rxjs";
import type {
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleDesyncAlertEvent
} from "@fuzzy-waddle/api-interfaces";
import { getCommunicator } from "../../data/scene-data";
import { getSceneService } from "./scene-component-helpers";
import { SimulationTickService } from "./simulation-tick.service";
import { SceneDialogHelper } from "../scenes/scene-dialog-helper";
import type DesyncRecoveryDialog from "../scenes/hud-scenes/DesyncRecoveryDialog";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";

/**
 * Handles the room-wide desync recovery flow triggered by the host once
 * correction snapshots fail to bring a client back into sync.
 *
 * Flow:
 *   1. Host broadcasts `desync-alert`.
 *   2. Every client pauses immediately and shows the dialog.
 *   3. Player chooses Wait (resume) or Kick (remove the desynced player and
 *      resume).
 *
 * Anti-grief:
 *   - At most 1 forced pause every MIN_PAUSE_INTERVAL_MS (60 s).
 *   - At most MAX_PAUSES_PER_MATCH (3) over the entire session.
 */
export class DesyncRecoveryService {
  /** True while the dialog is visible (prevents opening a second dialog). */
  private dialogOpen = false;
  private sub?: Subscription;

  init(hudScene: Phaser.Scene, probableWaffleScene: ProbableWaffleScene): void {
    const communicator = getCommunicator(probableWaffleScene);
    this.sub = communicator.desyncAlert?.on.subscribe((event) => {
      this.onDesyncDetected(event, hudScene, probableWaffleScene);
    });
  }

  private onDesyncDetected(
    data: ProbableWaffleDesyncAlertEvent,
    hudScene: Phaser.Scene,
    probableWaffleScene: ProbableWaffleScene
  ): void {
    if (this.dialogOpen) return;

    const simTick = getSceneService(probableWaffleScene, SimulationTickService);
    simTick?.pauseTick("desync");

    this.dialogOpen = true;

    const dialog = SceneDialogHelper.showDialog<DesyncRecoveryDialog>(hudScene, "DesyncRecoveryDialog");
    dialog.setup({
      tick: data.tick,
      playerNumber: data.desyncedPlayerNumber,
      onWait: () => {
        simTick?.resumeTick("desync");
        this.dialogOpen = false;
      },
      onKick: () => {
        console.warn(`[DESYNC] Removing player ${data.desyncedPlayerNumber} after desync at tick ${data.tick}.`);
        getCommunicator(probableWaffleScene).playerChanged?.send({
          gameInstanceId: probableWaffleScene.gameInstanceId,
          emitterUserId: probableWaffleScene.userId,
          property: "left",
          data: {
            playerControllerData: {
              playerDefinition: {
                player: {
                  playerNumber: data.desyncedPlayerNumber
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
    this.sub?.unsubscribe();
  }
}
