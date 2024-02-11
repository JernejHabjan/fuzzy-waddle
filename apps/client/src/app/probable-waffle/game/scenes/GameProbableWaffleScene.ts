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

export interface GameProbableWaffleSceneData {
  baseGameData: ProbableWaffleGameData;
  systems: any[]; // todo use
  components: any[]; // todo use
  services: any[]; // todo use - for example navigation service, audioService... which you can access from anywhere where scene is passed to
  initializers: {
    postCreate: BehaviorSubject<boolean>;
  };
}

export default class GameProbableWaffleScene extends ProbableWaffleScene {
  tilemap!: Phaser.Tilemaps.Tilemap;

  override getSceneGameData() {
    return this.sceneGameData;
  }

  private sceneGameData: GameProbableWaffleSceneData = {
    baseGameData: this.baseGameData,
    systems: [], // todo use
    components: [],
    services: [], // todo use
    initializers: {
      postCreate: new BehaviorSubject<boolean>(false)
    }
  } satisfies GameProbableWaffleSceneData;

  init() {
    super.init();
  }

  create() {
    super.create();
    const hud = this.scene.get<HudProbableWaffle>("HudProbableWaffle");
    hud.scene.start();
    new SceneGameState(this);
    new ScaleHandler(this, this.tilemap, { margins: { left: 150, bottom: 100 }, maxLayers: 8 });
    new CameraMovementHandler(this);
    new LightsHandler(this, { enableLights: false });
    new DepthHelper(this);
    new AnimatedTilemap(this, this.tilemap, this.tilemap.tilesets);
    new SingleSelectionHandler(this, hud, this.tilemap);
    new GameObjectSelectionHandler(this); // todo maybe this needs to be on individual game object?
    new SaveGame(this);
    new SceneActorCreator(this);
    this.sceneGameData.services.push(new NavigationService(this, this.tilemap));
    this.sceneGameData.initializers.postCreate.next(true);
  }
}
