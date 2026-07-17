import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { GameSessionState } from "@fuzzy-waddle/api-interfaces";

export class HudElementVisibilityHandler {
  private sessionStateSubscription?: { unsubscribe(): void };
  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly hudElements: Phaser.GameObjects.Components.Visible[]
  ) {
    scene.onShutdown.subscribe(() => this.destroy());
    scene.onPostCreate.subscribe(() => this.handleHudElements());
  }

  private handleHudElements() {
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
    const visible = sessionState === GameSessionState.InProgress;
    this.hudElements.forEach((element) => element.setVisible(visible));
  }

  private destroy() {
    this.sessionStateSubscription?.unsubscribe();
  }
}
