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
import TivaraMacemanMale from '../prefabs/characters/tivara/TivaraMacemanMale';

export interface GameProbableWaffleSceneData {
  baseGameData: ProbableWaffleGameData;
  systems: Record<string, any>; // todo use
  components: Record<string, any>; // todo use
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
    components: {}, // todo use
    services: {} // todo use
  } satisfies GameProbableWaffleSceneData;

  private readonly knownActorNames = ["tivaraMacemanMale"]; a b c // TODO

  init() {
    super.init();

    this.events.on(Phaser.GameObjects.Events.ADDED_TO_SCENE, (child: Phaser.GameObjects.GameObject) => {
      console.log("added to scene", child); a b c // TODO
    });
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

    this.loadActorsFromSaveGame();
  }

  private loadActorsFromSaveGame(){
    this.knownActorNames.forEach((actorName) => {
      // destroy all actors on scene with this name
      // load them again from save file
      this.scene.scene.children.each((child) => {
        if (child.name === actorName) {
          child.destroy(); a b c
        }
      });
      const saveFile = this.baseGameData.saveGameService.getSaveFile();
      const actor = saveFile.actors.find((actor) => actor.name === actorName);
      if (actor) {
        this.scene.add(this.getActor(actor));
      }
    });
  }
  private getActor(actor: any) {

    switch (actor.name) {
      case "tivaraMacemanMale":
        return new TivaraMacemanMale(this.scene.scene, actor.x, actor.y);
        break;
    }
  }
}
