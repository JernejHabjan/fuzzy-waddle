import { ActorDefinition, ProbableWaffleGameInstanceType } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;
import { GameProbableWaffleScene } from "../scenes/GameProbableWaffleScene";
import TivaraMacemanMale from "../prefabs/characters/tivara/TivaraMacemanMale";
import Hedgehog from "../prefabs/animals/Hedgehog";
import Sheep from "../prefabs/animals/Sheep";
import { ActorManager } from "./actor-manager";
import { filter } from "rxjs";

export class SaveGame {
  static SaveGameEvent = "SaveGameEvent";

  constructor(private scene: GameProbableWaffleScene) {
    this.loadActorsFromSaveGame();
    scene.onPostCreate.subscribe(() => this.postCreate());
    // only ones that have name: SaveGame.SaveGameEvent
    scene.communicator.allScenes
      .pipe(filter((scene) => scene.name === SaveGame.SaveGameEvent))
      .subscribe(() => this.onSaveGame());
    scene.onDestroy.subscribe(() => this.destroy());
  }

  private postCreate() {
    this.loadActorsFromSaveGame();
    // this.demoFillStateForSaveGame();
    this.saveAllKnownActorsToSaveGame();
  }
  private loadActorsFromSaveGame() {
    if (
      this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.type !==
      ProbableWaffleGameInstanceType.LoadFromSave
    )
      return;

    // destroy all actors on scene with this name
    // load them again from save file
    const toRemove: GameObject[] = [];
    this.scene.children.each((child) => {
      const name = child.constructor.name;
      console.log("Child", name);
      const knownActorName = ActorManager.actorMap[name];
      if (knownActorName) {
        toRemove.push(child);
        console.log("Removed actor from scene on game load", name);
      } else {
        console.log("Not removed actor from scene on game load", name);
      }
    });
    toRemove.forEach((child) => child.destroy());

    this.scene.baseGameData.gameInstance.gameState!.data.actors.forEach((actorDefinition) => {
      const actor = ActorManager.createActor(this.scene, actorDefinition.name, actorDefinition);
      this.scene.add.existing(actor);
      console.log("Added actor to scene on game load", actor);
    });
  }

  private saveAllKnownActorsToSaveGame() {
    if (
      this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.type ===
      ProbableWaffleGameInstanceType.LoadFromSave
    )
      return;

    this.scene.baseGameData.gameInstance.gameState!.data.actors = [];
    this.scene.children.each((child) => {
      const actorDefinition = ActorManager.getActorDefinitionFromActor(child);
      if (actorDefinition) {
        this.scene.baseGameData.gameInstance.gameState!.data.actors.push(actorDefinition);
      }
    });
  }

  private demoFillStateForSaveGame() {
    if (
      this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.type ===
      ProbableWaffleGameInstanceType.LoadFromSave
    )
      return;
    this.scene.baseGameData.gameInstance.gameState!.data.actors.push(
      {
        name: TivaraMacemanMale.name,
        x: 544,
        y: 900,
        z: 0
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
    );
  }

  private destroy() {
    this.scene.events.off(SaveGame.SaveGameEvent);
  }

  private onSaveGame() {
    this.saveAllKnownActorsToSaveGame();
    this.scene.communicator.saveGame.emit();
    console.log("Saved game");
  }
}
