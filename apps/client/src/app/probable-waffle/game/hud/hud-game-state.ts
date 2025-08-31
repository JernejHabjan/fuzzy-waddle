import { GameSessionState } from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { Subscription } from "rxjs";
import { environment } from "../../../../environments/environment";
import { getSceneService } from "../world/components/scene-component-helpers";
import { AudioService } from "../world/services/audio.service";
import { UiFeedbackSfxCountdownFinalSound, UiFeedbackSfxCountdownSound } from "./UiFeedbackSfx";
import HudProbableWaffle from "../world/scenes/hud-scenes/HudProbableWaffle";

export class HudGameState {
  private sessionStateSubscription?: Subscription;
  private onResizeSubscription: Subscription;
  private readonly text: Phaser.GameObjects.Text;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private audioService?: AudioService;
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
    this.handleCurrentSessionState(this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState!);
    this.sessionStateSubscription = this.scene.communicator.gameInstanceMetadataChanged?.on.subscribe(
      (metadataEvent) => {
        switch (metadataEvent.property) {
          case "sessionState":
            this.handleCurrentSessionState(metadataEvent.data.sessionState!);
            break;
        }
      }
    );
  }

  private handleCurrentSessionState(sessionState: GameSessionState) {
    const handleCountdown = environment.production;
    switch (sessionState) {
      case GameSessionState.NotStarted:
        throw new Error("Game should not be in this state " + sessionState);
      case GameSessionState.MovingPlayersToGame:
        // set it in the center of the screen (include scroll
        if (handleCountdown) {
          this.text.text = "Waiting for players to join...";
          this.text.visible = true;
          this.overlay.visible = true;
        }
        break;
      case GameSessionState.StartingTheGame:
        if (!this.text.active) return;
        if (handleCountdown) {
          this.text.text = "3";
          const soundDefinitionFinishBeep = UiFeedbackSfxCountdownFinalSound;
          this.audioService?.playAudioSprite(soundDefinitionFinishBeep.key, soundDefinitionFinishBeep.spriteName);
          this.text.visible = true;
          this.overlay.visible = true;

          const soundDefinitionBeep = UiFeedbackSfxCountdownSound;
          setTimeout(() => {
            if (this.text.active) {
              this.text.text = "2";
              this.audioService?.playAudioSprite(soundDefinitionBeep.key, soundDefinitionBeep.spriteName);
            }
          }, 1000);
          setTimeout(() => {
            if (this.text.active) {
              this.text.text = "1";
              this.audioService?.playAudioSprite(soundDefinitionBeep.key, soundDefinitionBeep.spriteName);
            }
          }, 2000);
          setTimeout(() => {
            if (this.text.active) {
              this.text.visible = false;
              this.audioService?.playAudioSprite(soundDefinitionBeep.key, soundDefinitionBeep.spriteName);
            }
            this.overlay.visible = false;
          }, 3000);
        } else {
          this.text.visible = false;
          this.overlay.visible = false;
        }
        break;
      case GameSessionState.InProgress:
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

  private destroy() {
    this.text.destroy();
    this.overlay.destroy();
    this.sessionStateSubscription?.unsubscribe();
    this.onResizeSubscription.unsubscribe();
  }
}
