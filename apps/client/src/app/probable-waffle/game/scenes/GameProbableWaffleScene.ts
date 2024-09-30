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

export interface GameProbableWaffleSceneData {
  baseGameData: ProbableWaffleGameData;
  systems: any[];
  components: any[];
  services: any[];
  initializers: {
    // used before postSceneInitialized
    sceneInitialized: BehaviorSubject<boolean>;
    // used when scene is fully created and initialized - is sent before postCreate event
    postSceneInitialized: BehaviorSubject<boolean>;
  };
}

export default class GameProbableWaffleScene extends ProbableWaffleScene {
  tilemap!: Phaser.Tilemaps.Tilemap;

  override getSceneGameData() {
    return this.sceneGameData;
  }

  private sceneGameData: GameProbableWaffleSceneData = {
    baseGameData: this.baseGameData,
    systems: [],
    components: [],
    services: [],
    initializers: {
      sceneInitialized: new BehaviorSubject<boolean>(false),
      postSceneInitialized: new BehaviorSubject<boolean>(false)
    }
  } satisfies GameProbableWaffleSceneData;

  init() {
    super.init();
  }

  create() {
    super.create();
    const hud = this.scene.get<HudProbableWaffle>("HudProbableWaffle") as HudProbableWaffle;
    hud.scene.start();
    hud.initializeWithParentScene(this);
    new SceneGameState(this);
    new ScaleHandler(this, this.tilemap, { margins: { left: 150, bottom: 100 }, maxLayers: 8 });
    new CameraMovementHandler(this);
    new LightsHandler(this, { enableLights: false });
    new DepthHelper(this);
    new AnimatedTilemap(this, this.tilemap, this.tilemap.tilesets);
    new SingleSelectionHandler(this, hud, this.tilemap);
    new GameObjectSelectionHandler(this); // todo maybe this needs to be on individual game object?
    new SaveGame(this);
    new RestartGame(this);
    const creator = new SceneActorCreator(this);
    creator.initActors();
    this.sceneGameData.components.push(new TilemapComponent(this.tilemap));
    this.sceneGameData.services.push(new NavigationService(this, this.tilemap), new AudioService());
    this.sceneGameData.systems.push(new AiPlayerHandler(this));

    this.sceneGameData.initializers.sceneInitialized.next(true);
    this.sceneGameData.initializers.postSceneInitialized.next(true);
  }

  private cleanup() {
    this.sceneGameData.components = [];
    this.sceneGameData.services = [];
    this.sceneGameData.systems = [];
    this.sceneGameData.initializers.sceneInitialized.next(false);
    this.sceneGameData.initializers.postSceneInitialized.next(false);
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
