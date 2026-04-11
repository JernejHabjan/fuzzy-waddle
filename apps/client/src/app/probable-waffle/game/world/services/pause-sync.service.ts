import type { ProbableWafflePauseChangedEvent } from "@fuzzy-waddle/api-interfaces";
import { getCurrentPlayerNumber, getCommunicator } from "../../data/scene-data";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { SimulationTickService } from "./simulation-tick.service";
import { getSceneService } from "./scene-component-helpers";
import { filter, type Subscription } from "rxjs";
import Phaser from "phaser";

export class PauseSyncService {
  private static readonly MIN_PAUSE_INTERVAL_MS = 60_000;
  private static readonly MAX_PAUSES_PER_MATCH = 3;
  private static readonly PLAYER_PAUSE_REASON = "player";

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
    if (!communicator.pauseChanged || this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }

    this.pauseChangedSub = communicator.pauseChanged.on.subscribe((event) => this.applyPauseEvent(event));
    this.pauseToggleRequestSub = communicator.allScenes
      .pipe(filter((event) => event.name === "pause-toggle-requested"))
      .subscribe(() => this.togglePause());
  }

  private togglePause(): void {
    if (this.scene.isSpectator || this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }

    const playerNumber = getCurrentPlayerNumber(this.scene);
    const communicator = getCommunicator(this.scene);
    if (!playerNumber || !communicator.pauseChanged) {
      return;
    }

    const nextPaused = !this.playerPaused;
    if (nextPaused && !this.canRequestPause()) {
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
      tickService.pauseTick(PauseSyncService.PLAYER_PAUSE_REASON);
    } else {
      tickService.resumeTick(PauseSyncService.PLAYER_PAUSE_REASON);
    }
  }

  destroy(): void {
    this.pauseChangedSub?.unsubscribe();
    this.pauseToggleRequestSub?.unsubscribe();
  }
}
