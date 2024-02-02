import { ActorDefinition } from "@fuzzy-waddle/api-interfaces";
import { GameProbableWaffleScene } from "../scenes/GameProbableWaffleScene";
import TivaraMacemanMale from "../prefabs/characters/tivara/TivaraMacemanMale";
import Hedgehog from "../prefabs/animals/Hedgehog";
import Sheep from "../prefabs/animals/Sheep";
import { ActorManager } from "./actor-manager";
import { filter } from "rxjs";
import GameObject = Phaser.GameObjects.GameObject;
import {
  SceneActorCreatorCommunicator,
  SceneActorSaveCommunicator
} from "../scenes/components/scene-actor-creator-communicator";

export class SaveGame {
  static SaveGameEvent = "SaveGameEvent";

  constructor(private scene: GameProbableWaffleScene) {
    scene.onPostCreate.subscribe(() => this.postCreate());
    // only ones that have name: SaveGame.SaveGameEvent
    scene.communicator.allScenes
      .pipe(filter((scene) => scene.name === SaveGame.SaveGameEvent))
      .subscribe(() => this.onSaveGame());
    scene.onDestroy.subscribe(() => this.destroy());
  }

  private postCreate() {
    this.loadActorsFromSaveGame();
    this.demoPostNewActors();
  }
  private loadActorsFromSaveGame() {
    if (!this.scene.baseGameData.gameInstance.gameInstanceMetadata.isStartupLoad()) return;

    // destroy all actors on scene with this name
    // load them again from save file
    const toRemove: GameObject[] = [];
    this.scene.children.each((child) => {
      const name = child.constructor.name;
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

  private demoPostNewActors() {
    const actors = [
      {
        name: TivaraMacemanMale.name,
        x: 544,
        y: 900,
        z: 0,
        owner: 1
      } as ActorDefinition,
      // add hedgehog and sheep
      {
        name: Hedgehog.name,
        x: 544,
        y: 800,
        z: 0
      } as ActorDefinition,
      {
        name: Sheep.name,
        x: 544,
        y: 850,
        z: 0
      } as ActorDefinition
    ];
    actors.forEach((actorDefinition) => {
      this.scene.events.emit(SceneActorCreatorCommunicator, actorDefinition);
    });
  }

  private destroy() {
    this.scene.events.off(SaveGame.SaveGameEvent);
  }

  private onSaveGame() {
    this.scene.events.emit(SceneActorSaveCommunicator);
    this.scene.communicator.saveGame.emit();
    console.log("Saved game");
  }
}
