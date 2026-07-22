import { filter, Subscription } from "rxjs";
import GameProbableWaffleScene from "../world/scenes/GameProbableWaffleScene";
import { getSceneComponent, getSceneService, getSceneSystem } from "../world/services/scene-component-helpers";
import { SceneActorCreator } from "../world/services/scene-actor-creator";
import { AoeZoneManager } from "../entity/systems/aoe-zone-manager";
import { TechTreeService } from "./tech-tree/tech-tree.service";
import type { SaveGamePayload } from "./save-game-payload";
import { SelectionGroupsComponent } from "../player/human-controller/selection-groups.component";
import { CameraMovementHandler } from "../player/human-controller/cameraMovementHandler";
import { type AllScenesEventData, ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";
import { AiPlayerHandler } from "../player/ai-controller/ai-player-handler";
import { SimulationTickService } from "../world/services/simulation-tick.service";
import { evaluateCampaignSaveEligibility } from "./campaign-save-eligibility";
import { GameSessionState } from "@fuzzy-waddle/platform-game-sessions";

export class SaveGame {
  private saveGameSubscription: Subscription;
  private saveInProgress = false;

  constructor(private scene: GameProbableWaffleScene) {
    this.saveGameSubscription = scene.communicator.allScenes
      .pipe(filter((event): event is Extract<AllScenesEventData, { name: "save-game" }> => event.name === "save-game"))
      .subscribe((event) => this.onSaveGame(event.data));
    scene.input.keyboard?.on("keydown", this.handleQuickSaveShortcut, this);
    scene.onShutdown.subscribe(() => this.destroy());
  }

  /** Ctrl+S creates/replaces the current mission or skirmish quicksave without opening a dialog. */
  private readonly handleQuickSaveShortcut = (event: KeyboardEvent): void => {
    if (!event.ctrlKey || event.code !== "KeyS" || event.repeat) return;
    // Prevent the browser's Save Page action while the Phaser game owns the keyboard shortcut.
    event.preventDefault();
    this.scene.communicator.allScenes.emit({ name: "save-game", data: { kind: "quicksave" } });
  };

  /**
   * Serialization stays in Phaser because only the scene can produce a coherent actor snapshot.
   * Automatic snapshots are rejected during pauses and while another save is running so they never
   * capture a modal-paused or partially serialized simulation.
   */
  private async onSaveGame(request: Pick<SaveGamePayload, "kind" | "checkpointId"> = { kind: "manual" }) {
    const kind = request.kind ?? "manual";
    if (this.saveInProgress) return;
    if (kind === "autosave" && !request.checkpointId && !this.canAutosave()) return;
    const tickService = getSceneService(this.scene, SimulationTickService);
    const eligibility = evaluateCampaignSaveEligibility({
      sceneActive: this.scene.sys.isActive(),
      sessionState: this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState,
      runtime: this.scene.baseGameData.gameInstance.gameState?.data.campaignMission,
      pauseReasons: tickService?.getPauseReasons() ?? [],
      request: { kind, checkpointId: request.checkpointId }
    });
    if (!eligibility.eligible) {
      if (kind !== "autosave") {
        this.scene.communicator.utilityEvents.emit({ name: "save-game-rejected", data: eligibility });
      }
      return;
    }
    this.saveInProgress = true;
    try {
      const sceneActorCreator = getSceneService(this.scene, SceneActorCreator);
      if (!sceneActorCreator) throw new Error("SceneActorCreator not found");
      sceneActorCreator.saveAllKnownActorsToGameState();

      // Save camera position and selection groups for the current player
      this.saveCurrentPlayerData();

      // Save AI behaviour tree state for all AI players
      this.saveAiPlayersState();

      // Save AOE zones
      this.saveAoeZones();

      // Save research state
      this.saveResearchState();

      const thumbnail = await this.takeScreenshot();
      this.scene.communicator.utilityEvents.emit({
        name: "save-game",
        data: {
          thumbnail,
          kind,
          ...(request.checkpointId ? { checkpointId: request.checkpointId } : {})
        } satisfies SaveGamePayload
      });
    } finally {
      this.saveInProgress = false;
    }
  }

  /** Autosaves only run after gameplay is active and the deterministic simulation is advancing. */
  private canAutosave(): boolean {
    const tickService = getSceneService(this.scene, SimulationTickService);
    return (
      this.scene.sys.isActive() &&
      this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState === GameSessionState.InProgress &&
      tickService !== undefined &&
      !tickService.isPaused
    );
  }

  private saveCurrentPlayerData(): void {
    const currentPlayer = this.scene.player;
    if (!currentPlayer) return;

    const playerDefinition = currentPlayer.playerController.data.playerDefinition;
    if (!playerDefinition) return;

    // Only save camera/groups for human players
    if (playerDefinition.playerType !== ProbableWafflePlayerType.Human) return;

    // Save camera state
    const cameraMovementHandler = getSceneComponent(this.scene, CameraMovementHandler);
    if (cameraMovementHandler) {
      currentPlayer.playerController.data.cameraState = cameraMovementHandler.getCameraState();
    }

    // Save selection groups
    const selectionGroupsComponent = getSceneComponent(this.scene, SelectionGroupsComponent);
    if (selectionGroupsComponent) {
      currentPlayer.playerController.data.selectionGroups = selectionGroupsComponent.getGroups();
    }
  }

  private saveAiPlayersState(): void {
    // Only run on host
    if (!this.scene.isHost) return;

    const aiPlayerHandler = getSceneSystem(this.scene, AiPlayerHandler);
    if (!aiPlayerHandler) return;

    // Save AI state for each AI player
    this.scene.players.forEach((player) => {
      const playerDefinition = player.playerController.data.playerDefinition;
      if (!playerDefinition) return;
      if (playerDefinition.playerType !== ProbableWafflePlayerType.AI) return;

      const playerNumber = player.playerNumber;
      if (playerNumber === undefined) return;

      const aiController = aiPlayerHandler.getAiPlayerController(playerNumber);
      if (aiController) {
        player.playerState.data.aiBehaviorTreeState = aiController.getSaveState();
      }
    });
  }

  private saveAoeZones() {
    const aoeZoneManager = getSceneService(this.scene, AoeZoneManager);
    if (!aoeZoneManager) return;

    this.scene.baseGameData.gameInstance.gameState!.data.aoeZones = aoeZoneManager.getData();
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
    this.scene.input.keyboard?.off("keydown", this.handleQuickSaveShortcut, this);
  }
}
