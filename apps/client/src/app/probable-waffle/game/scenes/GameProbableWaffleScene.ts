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
import TivaraMacemanMale from "../prefabs/characters/tivara/TivaraMacemanMale";
import GameObject = Phaser.GameObjects.GameObject;
import Transform = Phaser.GameObjects.Components.Transform;

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

  private readonly knownActorNames = [TivaraMacemanMale.name]; // TODO

  init() {
    super.init();

    // todo this.events.on(Phaser.GameObjects.Events.ADDED_TO_SCENE, (child: Phaser.GameObjects.GameObject) => {
    // todo   console.log("added to scene", child); // TODO
    // todo });
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

  private loadActorsFromSaveGame() {
    console.log("PRINTING KNOWN ACTOR NAMES", this.knownActorNames);
    this.knownActorNames.forEach((actorName) => {
      // destroy all actors on scene with this name
      // load them again from save file
      this.scene.scene.children.each((child) => {
        if (child.constructor.name === actorName) {
          child.destroy(); // todo

          console.warn("FOUND ACTOR WITH NAME", actorName);
        }
        console.log(child.constructor.name, "CONSTRUCTOR NAME");
      });
      // const saveFile = this.baseGameData.saveGameService.getSaveFile();

      const maceman = this.getActor({
        name: TivaraMacemanMale.name,
        x: 544,
        y: 900,
        z: 0
      });
      this.scene.scene.add.existing(maceman);
    });
  }
  private getActor(actorDefinition: { name: string; x: number; y: number; z: number }): GameObject {
    let actor: GameObject | undefined = undefined;
    switch (actorDefinition.name) {
      case TivaraMacemanMale.name:
        actor = new TivaraMacemanMale(this.scene.scene, actorDefinition.x, actorDefinition.y);
        break;
    }

    if (actor === undefined) {
      console.error(`Actor ${actorDefinition.name} not found`);
      throw new Error(`Actor ${actorDefinition.name} not found`);
    }
    (actor as any as Transform).z = actorDefinition.z; // todo?
    DepthHelper.setActorDepth(actor);
    return actor;
  }
}
