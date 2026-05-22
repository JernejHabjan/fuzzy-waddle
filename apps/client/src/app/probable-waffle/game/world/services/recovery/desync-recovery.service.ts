import type { Subscription } from "rxjs";
import type {
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleDesyncAlertEvent
} from "@fuzzy-waddle/api-interfaces";
import { getCommunicator } from "../../../data/scene-data";
import { getSceneService } from "../scene-component-helpers";
import { SimulationTickService } from "../simulation-tick.service";
import { SnapshotService } from "./snapshot.service";
import { SceneDialogHelper } from "../../scenes/scene-dialog-helper";
import type DesyncRecoveryDialog from "../../scenes/hud-scenes/DesyncRecoveryDialog";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import {
  type DesyncStateChangedSceneEvent,
  ProbableWaffleSceneEventName,
  type ReconnectSnapshotAppliedSceneEvent
} from "./probable-waffle-scene-events";

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
 *
 * Stall guard:
 *   After a "Wait" vote the desynced client waits for a correction snapshot.
 *   If none arrives within CORRECTION_TIMEOUT_MS, the pause is force-released
 *   so the client is not stuck forever.
 */
export class DesyncRecoveryService {
  private static readonly CORRECTION_TIMEOUT_MS = 15_000;

  /** True while the dialog is visible (prevents opening a second dialog). */
  private dialogOpen = false;
  private sub?: Subscription;
  private probableWaffleScene?: ProbableWaffleScene;
  private dialog?: DesyncRecoveryDialog;
  private activeDialogPlayerNumber?: number;
  /** Timeout handle for the correction-snapshot stall guard. */
  private correctionTimeoutHandle?: number;
  private snapshotAppliedHandler?: () => void;

  /** Wires desync-alert subscriptions and lifecycle listeners for dialog auto-recovery. */
  init(hudScene: Phaser.Scene, probableWaffleScene: ProbableWaffleScene): void {
    this.probableWaffleScene = probableWaffleScene;
    const communicator = getCommunicator(probableWaffleScene);
    this.sub = communicator.desyncAlert?.on.subscribe((event) => {
      this.onDesyncDetected(event, hudScene, probableWaffleScene);
    });
    probableWaffleScene.events.on(ProbableWaffleSceneEventName.DesyncStateChanged, this.onDesyncStateChanged, this);
    probableWaffleScene.events.on(
      ProbableWaffleSceneEventName.ReconnectSnapshotApplied,
      this.onReconnectSnapshotApplied,
      this
    );
    probableWaffleScene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Opens the recovery dialog, pauses simulation, and attaches Wait/Kick actions. */
  private onDesyncDetected(
    data: ProbableWaffleDesyncAlertEvent,
    hudScene: Phaser.Scene,
    probableWaffleScene: ProbableWaffleScene
  ): void {
    if (this.dialogOpen) return;

    const simTick = getSceneService(probableWaffleScene, SimulationTickService);
    const snapshotService = getSceneService(probableWaffleScene, SnapshotService);
    const desyncedPlayer = probableWaffleScene.baseGameData.gameInstance.getPlayerByNumber(data.desyncedPlayerNumber);
    const desyncedUserId = desyncedPlayer?.playerController.data.userId ?? null;
    const isLocalDesyncedPlayer = probableWaffleScene.playerOrNull?.playerNumber === data.desyncedPlayerNumber;
    simTick?.pauseTick("desync");

    this.dialogOpen = true;

    this.activeDialogPlayerNumber = data.desyncedPlayerNumber;
    this.dialog = SceneDialogHelper.showDialog<DesyncRecoveryDialog>(hudScene, "DesyncRecoveryDialog");
    this.dialog.setup({
      tick: data.tick,
      playerNumber: data.desyncedPlayerNumber,
      reason: data.reason,
      onWait: () => {
        if (probableWaffleScene.isHost && desyncedUserId) {
          snapshotService?.sendSnapshot(probableWaffleScene, desyncedUserId, "desync-correction");
          console.warn(
            `[DESYNC] Host resent correction snapshot to player ${data.desyncedPlayerNumber} after wait vote. reason=${data.reason ?? "unknown"}`
          );
        }
        if (isLocalDesyncedPlayer && !probableWaffleScene.isHost) {
          getCommunicator(probableWaffleScene).snapshotRequested?.send({
            gameInstanceId: probableWaffleScene.gameInstanceId,
            emitterUserId: probableWaffleScene.userId,
            reason: "desync-correction"
          });
          console.warn(
            `[DESYNC] Player ${data.desyncedPlayerNumber} requested a fresh correction snapshot after wait vote. reason=${data.reason ?? "unknown"}`
          );
          // Guard against the snapshot never arriving (host crash, network loss).
          // If no correction snapshot is applied within the timeout, force-release
          // the pause so this client is not frozen indefinitely.
          this.armCorrectionTimeout(simTick, data.desyncedPlayerNumber, probableWaffleScene);
        } else {
          simTick?.resumeTick("desync");
        }
        this.onDialogClosed();
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
        this.onDialogClosed();
      }
    });
  }

  /** Arms a fail-safe timeout so desync pause is not permanent when correction never arrives. */
  private armCorrectionTimeout(
    simTick: SimulationTickService | undefined,
    playerNumber: number,
    scene: ProbableWaffleScene
  ): void {
    this.clearCorrectionTimeout();

    // Cancel the timeout as soon as the snapshot is successfully applied.
    this.snapshotAppliedHandler = () => {
      this.clearCorrectionTimeout();
    };
    scene.events.once(ProbableWaffleSceneEventName.ReconnectSnapshotApplied, this.snapshotAppliedHandler);

    this.correctionTimeoutHandle = window.setTimeout(() => {
      console.error(
        `[DESYNC] Correction snapshot for player ${playerNumber} did not arrive within ` +
          `${DesyncRecoveryService.CORRECTION_TIMEOUT_MS}ms. Force-releasing desync pause to prevent permanent freeze.`
      );
      simTick?.resumeTick("desync");
      this.clearCorrectionTimeout(scene);
    }, DesyncRecoveryService.CORRECTION_TIMEOUT_MS);
  }

  /** Clears correction timeout and detaches one-shot snapshot listeners. */
  private clearCorrectionTimeout(scene?: ProbableWaffleScene): void {
    clearTimeout(this.correctionTimeoutHandle);
    this.correctionTimeoutHandle = undefined;
    if (this.snapshotAppliedHandler && scene) {
      scene.events.off(ProbableWaffleSceneEventName.ReconnectSnapshotApplied, this.snapshotAppliedHandler);
      this.snapshotAppliedHandler = undefined;
    }
  }

  /** Resets in-memory dialog state after explicit close path finishes. */
  private onDialogClosed(): void {
    this.dialogOpen = false;
    this.dialog = undefined;
    this.activeDialogPlayerNumber = undefined;
  }

  /** Closes dialog, resumes desync pause reason, and clears pending correction guard state. */
  private closeDialogIfOpen(simTick: SimulationTickService | undefined): void {
    if (!this.dialogOpen) {
      return;
    }
    this.dialog?.scene.stop();
    simTick?.resumeTick("desync");
    this.clearCorrectionTimeout(this.probableWaffleScene);
    this.onDialogClosed();
  }

  /** Auto-closes dialog once hash service reports the tracked player is back in sync. */
  private readonly onDesyncStateChanged = (event: DesyncStateChangedSceneEvent) => {
    if (event.state !== "resolved" || !this.dialogOpen) {
      return;
    }
    if (this.activeDialogPlayerNumber !== undefined && event.playerNumber !== this.activeDialogPlayerNumber) {
      return;
    }
    const simTick = this.probableWaffleScene && getSceneService(this.probableWaffleScene, SimulationTickService);
    this.closeDialogIfOpen(simTick);
  };

  /** Auto-closes dialog after desync-correction snapshot is applied locally. */
  private readonly onReconnectSnapshotApplied = (event: ReconnectSnapshotAppliedSceneEvent) => {
    if (event.reason !== "desync-correction") {
      return;
    }
    const simTick = this.probableWaffleScene && getSceneService(this.probableWaffleScene, SimulationTickService);
    this.closeDialogIfOpen(simTick);
  };

  /** Releases subscriptions/listeners and ensures desync pause cannot leak across scene teardown. */
  destroy(): void {
    // If the scene tears down while the desync dialog is open, ensure the
    // "desync" pause reason is released so SimulationTickService is not left stalled.
    if (this.dialogOpen) {
      const simTick = this.probableWaffleScene && getSceneService(this.probableWaffleScene, SimulationTickService);
      this.closeDialogIfOpen(simTick);
    }
    this.clearCorrectionTimeout(this.probableWaffleScene);
    this.sub?.unsubscribe();
    this.probableWaffleScene?.events.off(
      ProbableWaffleSceneEventName.DesyncStateChanged,
      this.onDesyncStateChanged,
      this
    );
    this.probableWaffleScene?.events.off(
      ProbableWaffleSceneEventName.ReconnectSnapshotApplied,
      this.onReconnectSnapshotApplied,
      this
    );
  }
}
