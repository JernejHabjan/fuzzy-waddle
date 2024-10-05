import { ActorManager } from "./actor-manager";
import { filter, Subscription } from "rxjs";
import {
  SceneActorCreatorCommunicator,
  SceneActorSaveCommunicator
} from "../scenes/components/scene-actor-creator-communicator";
import GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import { onPostSceneInitialized } from "./game-object-helper";
import GameObject = Phaser.GameObjects.GameObject;

export class SaveGame {
  private saveGameSubscription: Subscription;

  constructor(private scene: GameProbableWaffleScene) {
    onPostSceneInitialized(scene, this.postSceneInitialized, this);
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

    this.scene.baseGameData.gameInstance.gameState!.data.actors.forEach((actorDefinition) => {
      this.scene.events.emit(SceneActorCreatorCommunicator, actorDefinition);
    });
    console.log("Loaded game");
  }

  private destroy() {
    this.saveGameSubscription.unsubscribe();
  }

  private onSaveGame() {
    this.scene.events.emit(SceneActorSaveCommunicator);
  }
}
