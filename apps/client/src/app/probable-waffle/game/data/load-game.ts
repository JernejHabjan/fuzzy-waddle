import { ActorManager } from "./actor-manager";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SceneActorCreator } from "../world/services/scene-actor-creator";
import GameProbableWaffleScene from "../world/scenes/GameProbableWaffleScene";
import GameObject = Phaser.GameObjects.GameObject;

export class LoadGame {
  constructor(private readonly scene: GameProbableWaffleScene) {}
  loadActorsFromSaveGame() {
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
}
