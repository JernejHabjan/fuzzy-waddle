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

export class GameProbableWaffleScene extends ProbableWaffleScene {
  tilemap!: Phaser.Tilemaps.Tilemap;

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
  }
}
