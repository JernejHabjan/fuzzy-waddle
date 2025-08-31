import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { ScaleHandler } from "../map/scale.handler";
import { CameraMovementHandler } from "../managers/controllers/input/cameraMovementHandler";
import { LightsHandler } from "../map/vision/lights.handler";
import { DepthHelper } from "../map/depth.helper";
import { AnimatedTilemap } from "../map/animated-tile.helper";
import { SingleSelectionHandler } from "../managers/controllers/input/single-selection.handler";
import HudProbableWaffle from "./hud-scenes/HudProbableWaffle";
import { GameObjectSelectionHandler } from "../managers/controllers/input/game-object-selection.handler";
import { SceneGameState } from "../managers/game-state/scene-game-state";
import { type ProbableWaffleGameData } from "../../core/probable-waffle-game-data";
import { SaveGame } from "../../data/save-game";
import { SceneActorCreator } from "../components/scene-actor-creator";
import { NavigationService } from "../services/navigation.service";
import { BehaviorSubject } from "rxjs";
import { AudioService } from "../services/audio.service";
import { TilemapComponent } from "../components/tilemap.component";
import { RestartGame } from "../../data/restart-game";
import { AiPlayerHandler } from "../components/ai-player-handler";
import { BuildingCursor } from "../managers/controllers/building-cursor";
import { DebuggingService } from "../services/DebuggingService";
import { CrossSceneCommunicationService } from "../services/CrossSceneCommunicationService";
import { FogOfWarComponent } from "../components/fog-of-war.component";
import { SelectionGroupsComponent } from "../components/selection-groups.component";
import { GameModeConditionChecker } from "../managers/game-mode/GameModeConditionChecker";
import { getSceneExternalComponent } from "../components/scene-component-helpers";
import { AchievementService } from "../../../services/achievement/achievement.service";
import { AchievementType } from "../../../services/achievement/achievement-type";
import { environment } from "../../../../../environments/environment";
import { GameObjectActionAssigner } from "../managers/controllers/game-object-action-assigner";
import { PlayerActionsHandler } from "../managers/controllers/PlayerActionsHandler";
import { ActorIndexSystem } from "../services/ActorIndexSystem";

export interface ProbableWaffleSceneData {
  baseGameData: ProbableWaffleGameData;
  systems: any[];
  components: any[];
  services: any[];
  initializers: {
    sceneInitialized: BehaviorSubject<boolean>;
  };
}

export default class GameProbableWaffleScene extends ProbableWaffleScene {
  tilemap!: Phaser.Tilemaps.Tilemap;

  override init() {
    super.init();
  }

  override create() {
    const c = this.baseGameData.gameInstance.gameState;
    const hud = this.scene.get<HudProbableWaffle>("HudProbableWaffle") as HudProbableWaffle;
    hud.scene.start();
    hud.initializeWithParentScene(this);
    new SceneGameState(this);
    new ScaleHandler(this, this.tilemap, { margins: { left: 150, bottom: 100 }, maxLayers: 8 });
    new CameraMovementHandler(this);
    new LightsHandler(this, { enableLights: false });
    new DepthHelper(this);
    new AnimatedTilemap(this, this.tilemap, this.tilemap.tilesets);
    this.sceneGameData.components.push(new SingleSelectionHandler(this, hud, this.tilemap));
    new GameObjectSelectionHandler(this);
    new GameObjectActionAssigner(this);
    new SaveGame(this);
    new RestartGame(this, hud);
    new GameModeConditionChecker(this);
    const creator = new SceneActorCreator(this);
    const audioService = new AudioService(this);
    const playerActionsHandler = new PlayerActionsHandler(this, hud);
    const actorIndex = new ActorIndexSystem(this);

    this.sceneGameData.components.push(
      new TilemapComponent(this.tilemap),
      new BuildingCursor(this),
      new SelectionGroupsComponent(this)
    );
    this.sceneGameData.services.push(
      new NavigationService(this, this.tilemap),
      audioService,
      playerActionsHandler,
      creator,
      new DebuggingService(),
      new CrossSceneCommunicationService(),
      actorIndex
    );
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

  private cleanup() {
    this.sceneGameData.components = [];
    this.sceneGameData.services = [];
    this.sceneGameData.systems = [];
    this.sceneGameData.initializers.sceneInitialized.next(false);
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
