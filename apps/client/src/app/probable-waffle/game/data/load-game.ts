import { ActorManager } from "./actor-manager";
import { getSceneComponent, getSceneService, getSceneSystem } from "../world/services/scene-component-helpers";
import { SceneActorCreator } from "../world/services/scene-actor-creator";
import GameProbableWaffleScene from "../world/scenes/GameProbableWaffleScene";
import { SelectionGroupsComponent } from "../player/human-controller/selection-groups.component";
import { CameraMovementHandler } from "../player/human-controller/cameraMovementHandler";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/api-interfaces";
import { AiPlayerHandler } from "../player/ai-controller/ai-player-handler";
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
    console.log("Loaded game actors");
  }

  /**
   * Restore player-specific data after actors are loaded.
   * Call this after scene is fully initialized and actors are loaded.
   */
  restorePlayerData(): void {
    if (!this.scene.baseGameData.gameInstance.gameInstanceMetadata.isStartupLoad()) return;

    // Restore current player's camera and selection groups
    this.restoreCurrentPlayerData();

    // Restore AI players' behavior tree state
    this.restoreAiPlayersState();

    console.log("Loaded player data");
  }

  private restoreCurrentPlayerData(): void {
    const currentPlayer = this.scene.player;
    if (!currentPlayer) return;

    const playerDefinition = currentPlayer.playerController.data.playerDefinition;
    if (!playerDefinition) return;

    // Only restore camera/groups for human players
    if (playerDefinition.playerType !== ProbableWafflePlayerType.Human) return;

    // Restore camera state
    const cameraState = currentPlayer.playerController.data.cameraState;
    if (cameraState) {
      const cameraMovementHandler = getSceneComponent(this.scene, CameraMovementHandler);
      if (cameraMovementHandler) {
        cameraMovementHandler.setCameraState(cameraState);
      }
    }

    // Restore selection groups (delay slightly to ensure actors are fully initialized)
    const selectionGroups = currentPlayer.playerController.data.selectionGroups;
    if (selectionGroups && selectionGroups.length > 0) {
      // Use a short delay to ensure actors are indexed
      this.scene.time.delayedCall(100, () => {
        const selectionGroupsComponent = getSceneComponent(this.scene, SelectionGroupsComponent);
        if (selectionGroupsComponent) {
          selectionGroupsComponent.setGroups(selectionGroups);
        }
      });
    }
  }

  private restoreAiPlayersState(): void {
    // Only run on host
    if (!this.scene.isHost) return;

    const aiPlayerHandler = getSceneSystem(this.scene, AiPlayerHandler);
    if (!aiPlayerHandler) return;

    // Restore AI state for each AI player
    this.scene.players.forEach((player) => {
      const playerDefinition = player.playerController.data.playerDefinition;
      if (!playerDefinition) return;
      if (playerDefinition.playerType !== ProbableWafflePlayerType.AI) return;

      const aiState = player.playerState.data.aiBehaviorTreeState;
      if (!aiState) return;

      const playerNumber = player.playerNumber;
      if (playerNumber === undefined) return;

      const aiController = aiPlayerHandler.getAiPlayerController(playerNumber);
      if (aiController) {
        aiController.setSaveState(aiState);
      }
    });
  }
}
