import { ActorDefinition } from "@fuzzy-waddle/api-interfaces";
import { ActorManager } from "../../data/actor-manager";
import { SceneActorCreatorCommunicator, SceneActorSaveCommunicator } from "./scene-actor-creator-communicator";
import GameProbableWaffleScene from "../GameProbableWaffleScene";
import { onPostSceneInitialized } from "../../data/game-object-helper";

export class SceneActorCreator {
  constructor(private readonly scene: Phaser.Scene) {
    // NOTE: as this class uses ActorManager to create actors, it must not be accessed in components that are included in the actor definition (circular dependency)
    onPostSceneInitialized(this.scene, this.postSceneInitialized, this);
    this.scene.events.on(SceneActorCreatorCommunicator, this.createActorFromDefinition, this);
    this.scene.events.on(SceneActorSaveCommunicator, this.saveAllKnownActorsToSaveGame, this);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /**
   * After scene is created, store every actor in the game state.
   * All additional changes should be emitted through SceneActorCreatorCommunicator event and actors themselves
   */
  private postSceneInitialized() {
    this.saveAllKnownActorsToGameState();
  }

  private createActorFromDefinition(actorDefinition: ActorDefinition) {
    if (!actorDefinition.name) return;
    const actor = ActorManager.createActor(this.scene, actorDefinition.name, actorDefinition);
    this.scene.add.existing(actor);
    this.saveActorToGameState(actor);
  }

  private saveAllKnownActorsToGameState() {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    gameScene.baseGameData.gameInstance.gameState!.data.actors = [];
    gameScene.children.each((child) => {
      this.saveActorToGameState(child);
    });
  }

  private saveActorToGameState(actor: Phaser.GameObjects.GameObject) {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    const actorDefinition = ActorManager.getActorDefinitionFromActor(actor);
    if (actorDefinition) {
      // check if actor doesn't exist yet in the game state
      const existingActor = gameScene.baseGameData.gameInstance.gameState!.data.actors.find(
        (actor) => actor.id === actorDefinition.id
      );

      if (!existingActor) {
        gameScene.baseGameData.gameInstance.gameState!.data.actors.push(actorDefinition);
      }
    }
  }

  private saveAllKnownActorsToSaveGame() {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    // this.saveAllKnownActorsToGameState();
    this.scene.communicator.utilityEvents.emit({ name: "save-game" });
  }

  private destroy() {
    this.scene.events.off(SceneActorCreatorCommunicator, this.createActorFromDefinition, this);
    this.scene.events.off(SceneActorSaveCommunicator, this.saveAllKnownActorsToSaveGame, this);
  }
}
