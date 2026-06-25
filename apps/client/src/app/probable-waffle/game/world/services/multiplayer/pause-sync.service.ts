import type { ProbableWafflePauseChangedEvent } from "@fuzzy-waddle/api-interfaces";
import { getCommunicator, getCurrentPlayerNumber } from "../../../data/scene-data";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { SimulationPauseReason, SimulationTickService } from "../simulation-tick.service";
import { getSceneService } from "../scene-component-helpers";
import { filter, type Subscription } from "rxjs";
import Phaser from "phaser";

export class PauseSyncService {
  private static readonly MIN_PAUSE_INTERVAL_MS = 60_000;
  private static readonly MAX_PAUSES_PER_MATCH = 3;

  private pauseChangedSub?: Subscription;
  private pauseToggleRequestSub?: Subscription;
  private playerPaused = false;
  private playerPauseCount = 0;
  private lastPauseRequestedAt = 0;

  constructor(private readonly scene: ProbableWaffleScene) {
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.init();
  }

  private init(): void {
    const communicator = getCommunicator(this.scene);
    if (this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }

    this.pauseToggleRequestSub = communicator.allScenes
      .pipe(filter((event) => event.name === "pause-toggle-requested"))
      .subscribe(() => this.togglePause());
    if (communicator.pauseChanged) {
      this.pauseChangedSub = communicator.pauseChanged.on.subscribe((event) => this.applyPauseEvent(event));
    }
  }

  private togglePause(): void {
    if (this.scene.isSpectator || this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }

    const playerNumber = getCurrentPlayerNumber(this.scene);
    const communicator = getCommunicator(this.scene);
    if (!playerNumber) {
      return;
    }

    const nextPaused = !this.playerPaused;
    if (nextPaused && !this.canRequestPause()) {
      return;
    }

    if (!communicator.pauseChanged) {
      this.applyPauseEvent({
        gameInstanceId: this.scene.gameInstanceId,
        emitterUserId: this.scene.userId,
        playerNumber,
        paused: nextPaused
      });
      return;
    }

    communicator.pauseChanged.send({
      gameInstanceId: this.scene.gameInstanceId,
      emitterUserId: this.scene.userId,
      playerNumber,
      paused: nextPaused
    });
  }

  private canRequestPause(): boolean {
    const now = Date.now();
    if (this.playerPauseCount >= PauseSyncService.MAX_PAUSES_PER_MATCH) {
      return false;
    }
    if (now - this.lastPauseRequestedAt < PauseSyncService.MIN_PAUSE_INTERVAL_MS) {
      return false;
    }

    this.playerPauseCount++;
    this.lastPauseRequestedAt = now;
    return true;
  }

  private applyPauseEvent(event: ProbableWafflePauseChangedEvent): void {
    const tickService = getSceneService(this.scene, SimulationTickService);
    if (!tickService) {
      return;
    }

    this.playerPaused = event.paused;
    if (event.paused) {
      tickService.pauseTick(SimulationPauseReason.Player);
    } else {
      tickService.resumeTick(SimulationPauseReason.Player);
    }
  }

  destroy(): void {
    this.pauseChangedSub?.unsubscribe();
    this.pauseToggleRequestSub?.unsubscribe();
  }
}
