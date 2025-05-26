import { ActorManager } from "./actor-manager";
import { filter, Subscription } from "rxjs";
import GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import { getSceneService } from "../scenes/components/scene-component-helpers";
import { SceneActorCreator } from "../scenes/components/scene-actor-creator";
import { onSceneInitialized } from "./game-object-helper";
import GameObject = Phaser.GameObjects.GameObject;

export class SaveGame {
  private saveGameSubscription: Subscription;

  constructor(private scene: GameProbableWaffleScene) {
    onSceneInitialized(scene, this.postSceneInitialized, this);
    // only ones that have name: SaveGame.SaveGameEvent
    this.saveGameSubscription = scene.communicator.allScenes
      .pipe(filter((scene) => scene.name === "save-game"))
      .subscribe(() => this.onSaveGame());
    scene.onShutdown.subscribe(() => this.destroy());
  }

  private postSceneInitialized() {
    this.loadActorsFromSaveGame();
  }
  private loadActorsFromSaveGame() {
    if (!this.scene.baseGameData.gameInstance.gameInstanceMetadata.isStartupLoad()) return;

    // destroy all actors on scene with this name
    // load them again from save file
    const toRemove: GameObject[] = [];
    this.scene.children.each((child) => {
      const name = child.name;
      const knownActorName = ActorManager.actorMap[name];
      if (knownActorName) {
        toRemove.push(child);
        // console.log("Removed actor from scene on game load", name);
      } else {
        // console.log("Not removed actor from scene on game load", name);
      }
    });
    toRemove.forEach((child) => child.destroy());

    const sceneActorCreator = getSceneService(this.scene, SceneActorCreator);
    if (!sceneActorCreator) throw new Error("SceneActorCreator not found");

    this.scene.baseGameData.gameInstance.gameState!.data.actors.forEach((actorDefinition) => {
      sceneActorCreator.createActorFromDefinition(actorDefinition);
    });
    console.log("Loaded game");
  }

  private destroy() {
    this.saveGameSubscription.unsubscribe();
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
}

export interface SaveGamePayload {
  thumbnail: string;
}
