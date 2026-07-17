import { ActorManager } from "./actor-manager";
import { getSceneComponent, getSceneService, getSceneSystem } from "../world/services/scene-component-helpers";
import { SceneActorCreator } from "../world/services/scene-actor-creator";
import GameProbableWaffleScene from "../world/scenes/GameProbableWaffleScene";
import { SelectionGroupsComponent } from "../player/human-controller/selection-groups.component";
import { CameraMovementHandler } from "../player/human-controller/cameraMovementHandler";
import { type ActorId, ProbableWafflePlayerType, ResearchType } from "@fuzzy-waddle/api-interfaces";
import { AiPlayerHandler } from "../player/ai-controller/ai-player-handler";
import { emitEventSelection, getSelectableSceneChildren } from "./scene-data";
import { getActorComponent } from "./actor-component";
import { SelectableComponent } from "../entity/components/selectable-component";
import { IdComponent } from "../entity/components/id-component";
import { AoeZoneManager } from "../entity/systems/aoe-zone-manager";
import { TechTreeService } from "./tech-tree/tech-tree.service";
import { CancelableSimDelay } from "../world/services/simulation-time";
import GameObject = Phaser.GameObjects.GameObject;

export class LoadGame {
  constructor(private readonly scene: GameProbableWaffleScene) {}

  load() {
    // If loading, the initialActors should not be populated again in scene
    this.loadActorsFromSaveGame();
    // Restore player data (camera, selection groups, AI state) after actors are loaded
    this.restorePlayerData();
    // Load AOE zones
    this.loadAoeZones();
    // Load research state
    this.loadResearchState();
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
    // console.log("Loaded game actors");
  }

  /**
   * Restore player-specific data after actors are loaded.
   * Call this after scene is fully initialized and actors are loaded.
   */
  private restorePlayerData(): void {
    if (!this.scene.baseGameData.gameInstance.gameInstanceMetadata.isStartupLoad()) return;

    // Restore current player's camera and selection groups
    this.restoreCurrentPlayerData();

    // Restore AI players' behavior tree state
    this.restoreAiPlayersState();

    // console.log("Loaded player data");
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
      new CancelableSimDelay(this.scene, 100, () => {
        const selectionGroupsComponent = getSceneComponent(this.scene, SelectionGroupsComponent);
        if (selectionGroupsComponent) {
          selectionGroupsComponent.setGroups(selectionGroups);
        }
      });
    }

    // Restore current selection - sync selected actors to player state
    // SelectableComponent.setData() is called per-actor during load, but player state selection[] is not synced
    new CancelableSimDelay(this.scene, 150, () => {
      this.syncSelectionToPlayerState();
    });
  }

  /**
   * After actors are loaded with their selection state restored via setData(),
   * we need to sync the selection to the player state so the UI updates correctly.
   */
  private syncSelectionToPlayerState(): void {
    const selectableActors = getSelectableSceneChildren(this.scene);
    const selectedActorIds: ActorId[] = [];

    for (const actor of selectableActors) {
      const selectableComponent = getActorComponent(actor, SelectableComponent);
      const idComponent = getActorComponent(actor, IdComponent);
      if (selectableComponent?.getSelected() && idComponent?.id) {
        selectedActorIds.push(idComponent.id);
      }
    }

    if (selectedActorIds.length > 0) {
      emitEventSelection(this.scene, "selection.set", selectedActorIds);
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

  private loadAoeZones() {
    const gameState = this.scene.baseGameData.gameInstance.gameState!.data;
    if (!gameState.aoeZones || gameState.aoeZones.length === 0) return;

    const aoeZoneManager = getSceneService(this.scene, AoeZoneManager);
    if (!aoeZoneManager) {
      console.warn("AoeZoneManager not found, cannot restore AOE zones");
      return;
    }

    aoeZoneManager.setData(gameState.aoeZones);
    console.log(`Loaded ${gameState.aoeZones.length} AOE zones`);
  }

  private loadResearchState() {
    const gameState = this.scene.baseGameData.gameInstance.gameState!.data;
    if (!gameState.playerResearch) return;

    const techTreeService = getSceneService(this.scene, TechTreeService);
    if (!techTreeService) {
      console.warn("TechTreeService not found, cannot restore research state");
      return;
    }

    for (const [playerNumber, researchTypes] of Object.entries(gameState.playerResearch)) {
      techTreeService.setPlayerResearch(parseInt(playerNumber), researchTypes as ResearchType[]);
    }
    console.log("Loaded research state");
  }
}
