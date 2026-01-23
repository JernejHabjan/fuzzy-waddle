import { ActorManager } from "./actor-manager";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SceneActorCreator } from "../world/services/scene-actor-creator";
import GameProbableWaffleScene from "../world/scenes/GameProbableWaffleScene";
import { AoeZoneManager } from "../entity/systems/aoe-zone-manager";
import { TechTreeService } from "./tech-tree/tech-tree.service";
import { ResearchType } from "../entity/components/research/research-type";
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

    // Load AOE zones
    this.loadAoeZones();

    // Load research state
    this.loadResearchState();

    console.log("Loaded game");
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
      techTreeService.setPlayerResearch(
        parseInt(playerNumber),
        researchTypes as ResearchType[]
      );
    }
    console.log("Loaded research state");
  }
}
