import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { ScaleHandler } from "../../player/human-controller/scale.handler";
import { CameraMovementHandler } from "../../player/human-controller/cameraMovementHandler";
import { LightsHandler } from "./effects/lights.handler";
import { DepthHelper } from "../services/depth.helper";
import { AnimatedTilemap } from "../tilemap/animated-tiles/animated-tile.helper";
import { SingleSelectionHandler } from "../../player/human-controller/single-selection.handler";
import HudProbableWaffle from "./hud-scenes/HudProbableWaffle";
import { GameObjectSelectionHandler } from "../../player/human-controller/game-object-selection.handler";
import { SceneGameState } from "../state/scene-game-state";
import { GameSettings } from "../../core/gameSettings";
import { SaveGame } from "../../data/save-game";
import { SceneActorCreator } from "../services/scene-actor-creator";
import { NavigationService } from "../services/navigation.service";
import { AudioService } from "../services/audio.service";
import { RandomService } from "../services/random.service";
import { TilemapComponent } from "../tilemap/tilemap.component";
import { RestartGame } from "../../data/restart-game";
import { AiPlayerHandler } from "../../player/ai-controller/ai-player-handler";
import { BuildingCursor } from "../../player/human-controller/building-cursor";
import { DebuggingService } from "../services/DebuggingService";
import { CrossSceneCommunicationService } from "../services/CrossSceneCommunicationService";
import { FogOfWarComponent } from "../tilemap/fog-of-war.component";
import { SelectionGroupsComponent } from "../../player/human-controller/selection-groups.component";
import { GameModeConditionChecker } from "../state/GameModeConditionChecker";
import { getSceneExternalComponent } from "../services/scene-component-helpers";
import { AchievementService } from "../../../services/achievement/achievement.service";
import { AchievementType } from "../../../services/achievement/achievement-type";
import { environment } from "../../../../../environments/environment";
import { GameObjectActionAssigner } from "../../prefabs/gui/game-object-action-assigner";
import { PlayerActionsHandler } from "../../player/human-controller/player-actions-handler";
import { ActorIndexSystem } from "../services/ActorIndexSystem";
import { TechTreeService } from "../../data/tech-tree/tech-tree.service";
import { SelectionTabHandler } from "../../player/human-controller/selection-tab-handler";
import { LockedCursorHandler } from "../../player/human-controller/locked-cursor.handler";
import { ActorDebugDamageSystem } from "../services/actor-debug-damage-system";
import { SpellCursor } from "../../player/human-controller/spell-cursor";
import { AoeZoneManager } from "../../entity/systems/aoe-zone-manager";

export default class GameProbableWaffleScene extends ProbableWaffleScene {
  tilemap!: Phaser.Tilemaps.Tilemap;

  override init() {
    super.init();
  }

  override create() {
    const hud = this.scene.get<HudProbableWaffle>("HudProbableWaffle") as HudProbableWaffle;
    hud.scene.start();
    hud.initializeWithParentScene(this);

    new SceneGameState(this);
    new ScaleHandler(this, this.tilemap, { margins: { left: 150, bottom: 100 }, maxLayers: 8 });
    new LightsHandler(this, { enableLights: false });
    new DepthHelper(this);
    new AnimatedTilemap(this, this.tilemap, this.tilemap.tilesets);
    new GameObjectSelectionHandler(this);
    new GameObjectActionAssigner(this);
    new SaveGame(this);
    new RestartGame(this, hud);
    new GameModeConditionChecker(this);
    const creator = new SceneActorCreator(this);
    const actorIndex = new ActorIndexSystem(this);

    this.sceneGameData.components.push(
      this.getCameraMovementHandler(),
      new SingleSelectionHandler(this, hud, this.tilemap),
      new TilemapComponent(this.tilemap),
      new BuildingCursor(this),
      new SelectionGroupsComponent(this),
      new SelectionTabHandler(this)
    );
    this.sceneGameData.services.push(
      this.getRandomService(),
      new NavigationService(this, this.tilemap),
      new AudioService(this),
      new PlayerActionsHandler(this, hud),
      creator,
      new DebuggingService(),
      new CrossSceneCommunicationService(),
      actorIndex,
      new TechTreeService(),
      new SpellCursor(this),
      new AoeZoneManager(this)
    );
    new ActorDebugDamageSystem(this);
    this.sceneGameData.systems.push(new AiPlayerHandler(this));
    this.sceneGameData.components.push(new FogOfWarComponent(this, this.tilemap));

    creator.initInitialActors();
    // Populate the index after initial actors are in place
    actorIndex.scanExistingActors();

    super.create();

    this.scene.scene.data.set("justCreated", true);
    setTimeout(() => {
      this.scene.scene.data.remove("justCreated");
    });
    this.sceneGameData.initializers.sceneInitialized.next(true);

    if (!environment.production) {
      const achievementService = getSceneExternalComponent(this.scene.scene, AchievementService);
      achievementService?.unlockAchievement(AchievementType.FIRST_VICTORY); // just for test
    }
  }

  private getCameraMovementHandler(): CameraMovementHandler {
    const gameSettings = GameSettings.loadFromLocalStorage();
    return new CameraMovementHandler(this, {
      cameraEdgeMovementSpeed: 30,
      cameraKeyboardMovementSpeed: 2,
      enabledMouseCornerMovement: gameSettings.enabledMouseCornerMovement
    });
  }

  /**
   * Initialize RandomService with seed from game config for deterministic randomness
   */
  private getRandomService(): RandomService {
    const seed = this.sys.game.config.seed?.[0];
    if (!seed) throw new Error("Game seed is not defined");
    return new RandomService(seed);
  }

  private cleanup() {
    this.sceneGameData.components = [];
    this.sceneGameData.services = [];
    this.sceneGameData.systems = [];
    this.sceneGameData.initializers.sceneInitialized.next(false);
    LockedCursorHandler.releasePointerLock(this.input);
  }

  protected override shutDown() {
    super.shutDown();
    this.cleanup();
  }

  override destroy() {
    super.destroy();
    this.cleanup();
  }
}
