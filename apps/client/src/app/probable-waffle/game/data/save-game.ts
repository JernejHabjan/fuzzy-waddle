import { filter, Subscription } from "rxjs";
import GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import { getSceneService } from "../world/components/scene-component-helpers";
import { SceneActorCreator } from "../world/components/scene-actor-creator";

export class SaveGame {
  private saveGameSubscription: Subscription;

  constructor(private scene: GameProbableWaffleScene) {
    this.saveGameSubscription = scene.communicator.allScenes
      .pipe(filter((scene) => scene.name === "save-game"))
      .subscribe(() => this.onSaveGame());
    scene.onShutdown.subscribe(() => this.destroy());
  }

  private async onSaveGame() {
    const sceneActorCreator = getSceneService(this.scene, SceneActorCreator);
    if (!sceneActorCreator) throw new Error("SceneActorCreator not found");
    sceneActorCreator.saveAllKnownActorsToGameState();

    const thumbnail = await this.takeScreenshot();
    this.scene.communicator.utilityEvents.emit({
      name: "save-game",
      data: {
        thumbnail
      } satisfies SaveGamePayload
    });
  }

  private async takeScreenshot() {
    return new Promise<string>((resolve) => {
      this.scene.game.renderer.snapshot(
        (snapshot) => {
          const imageElement = snapshot as HTMLImageElement;
          // get base64 image
          const base64Image = imageElement.src;
          resolve(base64Image);
        },
        "image/jpeg",
        0.2
      );
    });
  }

  private destroy() {
    this.saveGameSubscription.unsubscribe();
  }
}

export interface SaveGamePayload {
  thumbnail: string;
}
