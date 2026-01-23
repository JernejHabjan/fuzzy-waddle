import { filter, Subscription } from "rxjs";
import GameProbableWaffleScene from "../world/scenes/GameProbableWaffleScene";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SceneActorCreator } from "../world/services/scene-actor-creator";
import { AoeZoneManager } from "../entity/systems/aoe-zone-manager";
import { TechTreeService } from "./tech-tree/tech-tree.service";
import type { SaveGamePayload } from "./save-game-payload";

export class SaveGame {
  private saveGameSubscription: Subscription;

  constructor(private scene: GameProbableWaffleScene) {
    this.saveGameSubscription = scene.communicator.allScenes
      .pipe(filter((scene) => scene.name === "save-game"))
      .subscribe(() => this.onSaveGame());
    scene.onShutdown.subscribe(() => this.destroy());
  }

  private async onSaveGame() {
    const sceneActorCreator = getSceneService(this.scene, SceneActorCreator);
    if (!sceneActorCreator) throw new Error("SceneActorCreator not found");
    sceneActorCreator.saveAllKnownActorsToGameState();

    // Save AOE zones
    this.saveAoeZones();

    // Save research state
    this.saveResearchState();

    const thumbnail = await this.takeScreenshot();
    this.scene.communicator.utilityEvents.emit({
      name: "save-game",
      data: {
        thumbnail
      } satisfies SaveGamePayload
    });
  }

  private saveAoeZones() {
    const aoeZoneManager = getSceneService(this.scene, AoeZoneManager);
    if (!aoeZoneManager) return;

    const gameState = this.scene.baseGameData.gameInstance.gameState!.data;
    gameState.aoeZones = aoeZoneManager.getData();
  }

  private saveResearchState() {
    const techTreeService = getSceneService(this.scene, TechTreeService);
    if (!techTreeService) return;

    const gameState = this.scene.baseGameData.gameInstance.gameState!.data;
    const researchData = techTreeService.getResearchData();

    // Convert Map to plain object for serialization
    const playerResearch: Record<number, string[]> = {};
    for (const [playerNumber, researchTypes] of researchData) {
      playerResearch[playerNumber] = researchTypes;
    }
    gameState.playerResearch = playerResearch;
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

  private destroy() {
    this.saveGameSubscription.unsubscribe();
  }
}
