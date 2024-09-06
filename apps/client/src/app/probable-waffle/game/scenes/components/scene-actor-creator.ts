import { ActorDefinition } from "@fuzzy-waddle/api-interfaces";
import { ActorManager } from "../../data/actor-manager";
import { SceneActorCreatorCommunicator, SceneActorSaveCommunicator } from "./scene-actor-creator-communicator";
import GameProbableWaffleScene from "../GameProbableWaffleScene";

export class SceneActorCreator {
  constructor(private readonly scene: Phaser.Scene) {
    // NOTE: as this class uses ActorManager to create actors, it must not be accessed in components that are included in the actor definition (circular dependency)
    this.scene.events.on(SceneActorCreatorCommunicator, this.createActorFromDefinition, this);
    this.scene.events.on(SceneActorSaveCommunicator, this.saveAllKnownActorsToSaveGame, this);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private createActorFromDefinition(actorDefinition: ActorDefinition) {
    if (!actorDefinition.name) return;
    const actor = ActorManager.createActor(this.scene, actorDefinition.name, actorDefinition);
    this.scene.add.existing(actor);
  }

  /**
   * todo this should be automatically done by the game state
   */
  private saveAllKnownActorsToGameState() {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    const gameScene = this.scene as GameProbableWaffleScene;
    gameScene.baseGameData.gameInstance.gameState!.data.actors = [];
    gameScene.children.each((child) => {
      const actorDefinition = ActorManager.getActorDefinitionFromActor(child);
      if (actorDefinition) {
        gameScene.baseGameData.gameInstance.gameState!.data.actors.push(actorDefinition);
      }
    });
  }

  private saveAllKnownActorsToSaveGame() {
    if (!(this.scene instanceof GameProbableWaffleScene)) return;
    this.saveAllKnownActorsToGameState();
    this.scene.communicator.utilityEvents.emit({ name: "save-game" });
  }

  private destroy() {
    this.scene.events.off(SceneActorCreatorCommunicator, this.createActorFromDefinition, this);
    this.scene.events.off(SceneActorSaveCommunicator, this.saveAllKnownActorsToSaveGame, this);
  }
}
