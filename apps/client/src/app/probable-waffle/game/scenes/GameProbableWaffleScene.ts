import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { ScaleHandler } from "../world/map/scale.handler";
import { CameraMovementHandler } from "../world/managers/controllers/input/cameraMovementHandler";
import { LightsHandler } from "../world/map/vision/lights.handler";
import { DepthHelper } from "../world/map/depth.helper";
import { AnimatedTilemap } from "../world/map/animated-tile.helper";
import { SingleSelectionHandler } from "../world/managers/controllers/input/single-selection.handler";
import HudProbableWaffle from "./HudProbableWaffle";
import { GameObjectSelectionHandler } from "../world/managers/controllers/input/game-object-selection.handler";
import { SceneGameState } from "../world/managers/game-state/scene-game-state";
import { ProbableWaffleGameData } from "./probable-waffle-game-data";
import { SaveGame } from "../data/save-game";
import { SceneActorCreator } from "./components/scene-actor-creator";
import { NavigationService } from "./services/navigation.service";
import { BehaviorSubject } from "rxjs";
import { AudioService } from "./services/audio.service";
import { TilemapComponent } from "./components/tilemap.component";
import { RestartGame } from "../data/restart-game";
import { AiPlayerHandler } from "./components/ai-player-handler";
import { BuildingCursor } from "../world/managers/controllers/building-cursor";
import { DebuggingService } from "./services/DebuggingService";
import { CrossSceneCommunicationService } from "./services/CrossSceneCommunicationService";
import { FogOfWarComponent } from "./components/fog-of-war.component";
import { SelectionGroupsComponent } from "./components/selection-groups.component";
import { GameModeConditionChecker } from "../world/managers/game-mode/GameModeConditionChecker";
import { getSceneExternalComponent } from "./components/scene-component-helpers";
import { AchievementService } from "../../services/achievement/achievement.service";
import { AchievementType } from "../../services/achievement/achievement-type";
import { environment } from "../../../../environments/environment";

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

  init() {
    super.init();
  }

  create() {
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
    new SaveGame(this);
    new RestartGame(this, hud);
    new GameModeConditionChecker(this);
    const creator = new SceneActorCreator(this);
    const audioService = new AudioService(this);

    this.sceneGameData.components.push(
      new TilemapComponent(this.tilemap),
      new BuildingCursor(this),
      new SelectionGroupsComponent(this)
    );
    this.sceneGameData.services.push(
      new NavigationService(this, this.tilemap),
      audioService,
      creator,
      new DebuggingService(),
      new CrossSceneCommunicationService()
    );
    this.sceneGameData.systems.push(new AiPlayerHandler(this));
    this.sceneGameData.components.push(new FogOfWarComponent(this, this.tilemap));

    creator.initInitialActors();

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

  protected shutDown() {
    super.shutDown();
    this.cleanup();
  }

  destroy() {
    super.destroy();
    this.cleanup();
  }
}
