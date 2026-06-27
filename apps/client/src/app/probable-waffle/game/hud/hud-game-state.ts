import { GameSessionState, ProbableWaffleGameInstanceType } from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { Subscription } from "rxjs";
import { getSceneService } from "../world/services/scene-component-helpers";
import { AudioService } from "../world/services/audio.service";
import { UiFeedbackSfxCountdownFinalSound, UiFeedbackSfxCountdownSound } from "./UiFeedbackSfx";
import HudProbableWaffle from "../world/scenes/hud-scenes/HudProbableWaffle";

export class HudGameState {
  private static readonly READY_COUNTDOWN_DEFER_MS = 1000;
  private sessionStateSubscription?: Subscription;
  private onResizeSubscription: Subscription;
  private readonly text: Phaser.GameObjects.Text;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private audioService?: AudioService;
  private countdownTimers: ReturnType<typeof setTimeout>[] = [];
  private countdownGeneration = 0;
  constructor(
    private readonly scene: HudProbableWaffle,
    private readonly probableWaffleScene: ProbableWaffleScene
  ) {
    scene.onShutdown.subscribe(() => this.destroy());
    scene.onPostCreate.subscribe(() => this.listen());
    this.overlay = this.scene.add.rectangle(0, 0, 0, 0, 0x000000, 0.5);
    this.overlay.depth = 1;
    this.text = this.scene.add
      .text(0, 0, "", {
        align: "center",
        fontSize: "64px",
        shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 2, stroke: true, fill: true }
      })
      .setOrigin(0.5, 0.5);
    this.text.depth = this.overlay.depth + 1;
    this.handleResize();
    this.onResizeSubscription = this.scene.onResize.subscribe(() => {
      this.handleResize();
    });
  }

  private handleResize() {
    this.overlay.setPosition(
      this.scene.cameras.main.centerX + this.scene.cameras.main.scrollX,
      this.scene.cameras.main.centerY + this.scene.cameras.main.scrollY
    );
    this.overlay.setSize(this.scene.cameras.main.width, this.scene.cameras.main.height);

    this.text.setPosition(
      this.scene.cameras.main.centerX + this.scene.cameras.main.scrollX,
      this.scene.cameras.main.centerY + this.scene.cameras.main.scrollY
    );
  }

  private listen() {
    this.audioService = getSceneService(this.probableWaffleScene, AudioService);
    this.pauseUntilAllPlayersAreReady();
  }

  pauseUntilAllPlayersAreReady() {
    const currentSessionState = this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState;
    if (currentSessionState !== undefined) {
      this.handleCurrentSessionState(currentSessionState);
    }
    this.sessionStateSubscription = this.scene.communicator.gameInstanceMetadataChanged?.on.subscribe(
      (metadataEvent) => {
        switch (metadataEvent.property) {
          case "sessionState":
            if (metadataEvent.data.sessionState !== undefined) {
              this.handleCurrentSessionState(metadataEvent.data.sessionState);
            }
            break;
        }
      }
    );
  }

  private handleCurrentSessionState(sessionState: GameSessionState) {
    switch (sessionState) {
      case GameSessionState.NotStarted:
        throw new Error("Game should not be in this state " + sessionState);
      case GameSessionState.MovingPlayersToGame:
        this.clearCountdownTimers();
        // set it in the center of the screen (include scroll
        this.text.text = "Waiting for players to join...";
        this.text.visible = true;
        this.overlay.visible = true;
        break;
      case GameSessionState.StartingTheGame:
        if (!this.shouldShowStartCountdown()) {
          this.clearCountdownTimers();
          this.text.visible = false;
          this.overlay.visible = false;
          break;
        }
        if (!this.text.active) return;
        this.startDeferredCountdown();
        break;
      case GameSessionState.InProgress:
        this.clearCountdownTimers();
        if (!this.text.active) return;
        this.text.visible = false;
        this.overlay.visible = false;
        break;
      case GameSessionState.ToScoreScreen:
        this.scene.scene.stop();
        this.scene.destroy();
        break;
    }
  }

  private shouldShowStartCountdown(): boolean {
    const gameType = this.probableWaffleScene.baseGameData.gameInstance.gameInstanceMetadata.data.type;
    return (
      gameType === ProbableWaffleGameInstanceType.Matchmaking ||
      gameType === ProbableWaffleGameInstanceType.SelfHosted
    );
  }

  /**
   * Gives clients a short grace period after the ready barrier opens so actor
   * state, HUD state, and initial lockstep buffers finish settling before the
   * visible 3-2-1 countdown starts.
   */
  private startDeferredCountdown(): void {
    this.clearCountdownTimers();
    const generation = ++this.countdownGeneration;
    this.text.text = "Starting...";
    this.text.visible = true;
    this.overlay.visible = true;

    this.scheduleCountdownTimer(() => {
      if (generation !== this.countdownGeneration || !this.text.active) {
        return;
      }
      this.text.text = "3";
      const soundDefinitionFinishBeep = UiFeedbackSfxCountdownFinalSound;
      this.audioService?.playAudioSprite(soundDefinitionFinishBeep.key, soundDefinitionFinishBeep.spriteName);

      const soundDefinitionBeep = UiFeedbackSfxCountdownSound;
      this.scheduleCountdownTimer(() => {
        if (generation === this.countdownGeneration && this.text.active) {
          this.text.text = "2";
          this.audioService?.playAudioSprite(soundDefinitionBeep.key, soundDefinitionBeep.spriteName);
        }
      }, 1000);
      this.scheduleCountdownTimer(() => {
        if (generation === this.countdownGeneration && this.text.active) {
          this.text.text = "1";
          this.audioService?.playAudioSprite(soundDefinitionBeep.key, soundDefinitionBeep.spriteName);
        }
      }, 2000);
      this.scheduleCountdownTimer(() => {
        if (generation === this.countdownGeneration && this.text.active) {
          this.text.visible = false;
          this.audioService?.playAudioSprite(soundDefinitionBeep.key, soundDefinitionBeep.spriteName);
        }
        if (generation === this.countdownGeneration) {
          this.overlay.visible = false;
        }
      }, 3000);
    }, HudGameState.READY_COUNTDOWN_DEFER_MS);
  }

  private scheduleCountdownTimer(callback: () => void, delayMs: number): void {
    this.countdownTimers.push(setTimeout(callback, delayMs));
  }

  private clearCountdownTimers(): void {
    this.countdownGeneration++;
    for (const timer of this.countdownTimers) {
      clearTimeout(timer);
    }
    this.countdownTimers = [];
  }

  private destroy() {
    this.clearCountdownTimers();
    this.text.destroy();
    this.overlay.destroy();
    this.sessionStateSubscription?.unsubscribe();
    this.onResizeSubscription.unsubscribe();
  }
}
