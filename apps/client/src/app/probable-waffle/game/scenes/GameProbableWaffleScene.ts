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
import { ActorDefinition, ProbableWaffleGameInstanceType } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;
import Transform = Phaser.GameObjects.Components.Transform;
import TivaraSlingshotFemale from "../prefabs/characters/tivara/TivaraSlingshotFemale";
import TivaraWorkerFemale from "../prefabs/characters/tivara/TivaraWorkerFemale";
import TivaraWorkerMale from "../prefabs/characters/tivara/TivaraWorkerMale";
import SkaduweeOwl from "../prefabs/units/skaduwee/SkaduweeOwl";
import SkaduweeRangedFemale from "../prefabs/characters/skaduwee/SkaduweeRangedFemale";
import SkaduweeMagicianFemale from "../prefabs/characters/skaduwee/SkaduweeMagicianFemale";
import SkaduweeWarriorMale from "../prefabs/characters/skaduwee/SkaduweeWarriorMale";
import SkaduweeWorkerMale from "../prefabs/characters/skaduwee/SkaduweeWorkerMale";
import SkaduweeWorkerFemale from "../prefabs/characters/skaduwee/SkaduweeWorkerFemale";
import FrostForge from "../prefabs/buildings/skaduwee/FrostForge";
import InfantryInn from "../prefabs/buildings/skaduwee/InfantryInn";
import Owlery from "../prefabs/buildings/skaduwee/Owlery";
import AnkGuard from "../prefabs/buildings/tivara/AnkGuard";
import Olival from "../prefabs/buildings/tivara/Olival";
import Temple from "../prefabs/buildings/tivara/Temple";
import WorkMill from "../prefabs/buildings/tivara/WorkMill";
import Sandhold from "../prefabs/buildings/tivara/Sandhold";
import GeneralWarrior from "../prefabs/characters/general/GeneralWarrior";
import Hedgehog from "../prefabs/animals/Hedgehog";
import Sheep from "../prefabs/animals/Sheep";
import Tree1 from "../prefabs/outside/foliage/trees/resources/Tree1";
import Tree6 from "../prefabs/outside/foliage/trees/resources/Tree6";
import Tree4 from "../prefabs/outside/foliage/trees/resources/Tree4";
import Tree5 from "../prefabs/outside/foliage/trees/resources/Tree5";
import Tree7 from "../prefabs/outside/foliage/trees/resources/Tree7";
import Tree10 from "../prefabs/outside/foliage/trees/resources/Tree10";
import Tree9 from "../prefabs/outside/foliage/trees/resources/Tree9";
import Tree11 from "../prefabs/outside/foliage/trees/resources/Tree11";

type ActorConstructor = new (scene: Phaser.Scene) => GameObject;

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

  private readonly actorMap: { [name: string]: ActorConstructor } = {
    // ANIMALS
    [Hedgehog.name]: Hedgehog,
    [Sheep.name]: Sheep,
    // END ANIMALS

    // GENERAL
    [GeneralWarrior.name]: GeneralWarrior,
    // END GENERAL

    // TIVARA
    [TivaraMacemanMale.name]: TivaraMacemanMale,
    [TivaraSlingshotFemale.name]: TivaraSlingshotFemale,
    [TivaraWorkerFemale.name]: TivaraWorkerFemale,
    [TivaraWorkerMale.name]: TivaraWorkerMale,
    [AnkGuard.name]: AnkGuard,
    [Olival.name]: Olival,
    [Sandhold.name]: Sandhold,
    [Temple.name]: Temple,
    [WorkMill.name]: WorkMill,
    // END TIVARA

    // SKADUWEE
    [SkaduweeOwl.name]: SkaduweeOwl,
    [SkaduweeRangedFemale.name]: SkaduweeRangedFemale,
    [SkaduweeMagicianFemale.name]: SkaduweeMagicianFemale,
    [SkaduweeWarriorMale.name]: SkaduweeWarriorMale,
    [SkaduweeWorkerMale.name]: SkaduweeWorkerMale,
    [SkaduweeWorkerFemale.name]: SkaduweeWorkerFemale,
    [FrostForge.name]: FrostForge,
    [InfantryInn.name]: InfantryInn,
    [Owlery.name]: Owlery,
    // END SKADUWEE

    // Trees
    [Tree1.name]: Tree1,
    [Tree4.name]: Tree4,
    [Tree5.name]: Tree5,
    [Tree6.name]: Tree6,
    [Tree7.name]: Tree7,
    [Tree9.name]: Tree9,
    [Tree10.name]: Tree10,
    [Tree11.name]: Tree11
    // END Trees
  };

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
  }

  protected postCreate() {
    super.postCreate();

    setTimeout(() => {
      this.loadActorsFromSaveGame();
      // this.demoFillStateForSaveGame();
      this.saveAllKnownActorsToSaveGame();
    }, 500);
  }

  private demoFillStateForSaveGame() {
    if (this.baseGameData.gameInstance.gameInstanceMetadata.data.type === ProbableWaffleGameInstanceType.LoadFromSave)
      return;
    this.baseGameData.gameInstance.gameState!.data.actors.push(
      {
        name: TivaraMacemanMale.name,
        x: 544,
        y: 900,
        z: 0
      } as ActorDefinition,
      // add hedgehog and sheep
      {
        name: Hedgehog.name,
        x: 544,
        y: 800,
        z: 0
      } as ActorDefinition,
      {
        name: Sheep.name,
        x: 544,
        y: 850,
        z: 0
      } as ActorDefinition
    );
  }

  private saveAllKnownActorsToSaveGame() {
    if (this.baseGameData.gameInstance.gameInstanceMetadata.data.type === ProbableWaffleGameInstanceType.LoadFromSave)
      return;

    this.scene.scene.children.each((child) => {
      const actorDefinition = this.getActorDefinitionFromActor(child);
      if (actorDefinition) {
        this.baseGameData.gameInstance.gameState!.data.actors.push(actorDefinition);
      }
    });
  }

  private getActorDefinitionFromActor(actor: GameObject): ActorDefinition | undefined {
    const actorName = actor.constructor.name;
    if (!this.actorMap[actorName]) {
      // console.error(`Actor ${actorName} not found`);
      return undefined;
    }
    const actorDefinition: ActorDefinition = {
      name: actorName,
      x: (actor as any as Transform).x,
      y: (actor as any as Transform).y,
      z: (actor as any as Transform).z
    };
    return actorDefinition;
  }

  private loadActorsFromSaveGame() {
    if (this.baseGameData.gameInstance.gameInstanceMetadata.data.type !== ProbableWaffleGameInstanceType.LoadFromSave)
      return;

    // destroy all actors on scene with this name
    // load them again from save file
    const toRemove: GameObject[] = [];
    this.children.each((child) => {
      const name = child.constructor.name;
      console.log("Child", name);
      const knownActorName = this.actorMap[name];
      if (knownActorName) {
        toRemove.push(child);
        console.log("Removed actor from scene on game load", name);
      } else {
        console.log("Not removed actor from scene on game load", name);
      }
    });
    toRemove.forEach((child) => child.destroy());

    this.baseGameData.gameInstance.gameState!.data.actors.forEach((actorDefinition) => {
      const actor = this.createActor(actorDefinition.name, actorDefinition);
      this.scene.scene.add.existing(actor);
      console.log("Added actor to scene on game load", actor);
    });
  }
  private createActor(name: string, properties: any): GameObject {
    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(this.scene.scene);

    (actor as any as Transform).x = properties.x; // todo?
    (actor as any as Transform).y = properties.y; // todo?
    (actor as any as Transform).z = properties.z; // todo?
    DepthHelper.setActorDepth(actor);
    return actor;
  }
}
