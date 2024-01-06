import { GameSessionState } from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { Subscription } from "rxjs";

export class HudGameState {
  private sessionStateSubscription?: Subscription;
  private onResizeSubscription: Subscription;
  private readonly text: Phaser.GameObjects.Text;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  constructor(private readonly scene: ProbableWaffleScene) {
    scene.onDestroy.subscribe(() => this.destroy());
    scene.onPostCreate.subscribe(() => this.listen());
    this.overlay = this.scene.add.rectangle(0, 0, 0, 0, 0x000000, 0.5);
    this.text = this.scene.add.text(0, 0, "", { align: "center", fontSize: "32px" }).setOrigin(0.5, 0.5);
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
    this.pauseUntilAllPlayersAreReady();
  }

  pauseUntilAllPlayersAreReady() {
    this.handleCurrentSessionState(this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState!);
    this.sessionStateSubscription = this.scene.baseGameData.communicator.gameInstanceMetadataChanged?.on.subscribe(
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
    switch (sessionState) {
      case GameSessionState.NotStarted:
        throw new Error("Game should not be in this state " + sessionState);
      case GameSessionState.MovingPlayersToGame:
        // set it in the center of the screen (include scroll
        this.text.text = "Waiting for players to join...";
        this.text.visible = true;
        this.overlay.visible = true;
        break;
      case GameSessionState.StartingTheGame:
        this.text.text = "3";
        this.text.visible = true;
        this.overlay.visible = true;
        setTimeout(() => {
          this.text.text = "2";
        }, 1000);
        setTimeout(() => {
          this.text.text = "1";
        }, 2000);
        setTimeout(() => {
          this.text.visible = false;
          this.overlay.visible = false;
        }, 3000);
        break;
      case GameSessionState.InProgress:
        this.text.visible = false;
        this.overlay.visible = false;
        break;
      case GameSessionState.EnteringScoreScreen:
        this.scene.scene.stop();
        break;
      case GameSessionState.InScoreScreen:
      case GameSessionState.Stopped:
        throw new Error("HUD should be destroyed at this point");
    }
  }

  private destroy() {
    this.text.destroy();
    this.overlay.destroy();
    this.sessionStateSubscription?.unsubscribe();
    this.onResizeSubscription.unsubscribe();
  }
}
