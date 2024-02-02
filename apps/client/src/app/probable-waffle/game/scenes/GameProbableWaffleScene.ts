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

export interface GameProbableWaffleSceneData {
  baseGameData: ProbableWaffleGameData;
  systems: Record<string, any>; // todo use
  components: any[]; // todo use
  services: Record<string, any>; // todo use - for example navigation service, audioService... which you can access from anywhere where scene is passed to
}

export class GameProbableWaffleScene extends ProbableWaffleScene {
  tilemap!: Phaser.Tilemaps.Tilemap;

  override getSceneGameData() {
    return this.sceneGameData;
  }

  private sceneGameData: GameProbableWaffleSceneData = {
    baseGameData: this.baseGameData,
    systems: {}, // todo use
    components: [],
    services: {} // todo use
  } satisfies GameProbableWaffleSceneData;

  init() {
    super.init();
  }

  create() {
    super.create();

    this.scene.get<HudProbableWaffle>("HudProbableWaffle").scene.start();
    new SceneGameState(this);
    new ScaleHandler(this, this.tilemap, { margins: { left: 150, bottom: 100 }, maxLayers: 8 });
    new CameraMovementHandler(this);
    new LightsHandler(this, { enableLights: false });
    new DepthHelper(this);
    new AnimatedTilemap(this, this.tilemap, this.tilemap.tilesets);
    new SingleSelectionHandler(this, this.tilemap);
    new GameObjectSelectionHandler(this); // todo maybe this needs to be on individual game object?
    new SaveGame(this);
    new SceneActorCreator(this);
  }
}
