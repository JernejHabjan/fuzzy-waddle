import Hedgehog from "../prefabs/animals/Hedgehog";
import Sheep from "../prefabs/animals/Sheep";
import GeneralWarrior from "../prefabs/characters/general/GeneralWarrior";
import TivaraMacemanMale from "../prefabs/characters/tivara/TivaraMacemanMale";
import TivaraSlingshotFemale from "../prefabs/characters/tivara/TivaraSlingshotFemale";
import TivaraWorkerFemale from "../prefabs/characters/tivara/TivaraWorkerFemale";
import TivaraWorkerMale from "../prefabs/characters/tivara/TivaraWorkerMale";
import AnkGuard from "../prefabs/buildings/tivara/AnkGuard";
import Olival from "../prefabs/buildings/tivara/Olival";
import Sandhold from "../prefabs/buildings/tivara/Sandhold";
import Temple from "../prefabs/buildings/tivara/Temple";
import WorkMill from "../prefabs/buildings/tivara/WorkMill";
import SkaduweeOwl from "../prefabs/units/skaduwee/SkaduweeOwl";
import SkaduweeRangedFemale from "../prefabs/characters/skaduwee/SkaduweeRangedFemale";
import SkaduweeMagicianFemale from "../prefabs/characters/skaduwee/SkaduweeMagicianFemale";
import SkaduweeWarriorMale from "../prefabs/characters/skaduwee/SkaduweeWarriorMale";
import SkaduweeWorkerMale from "../prefabs/characters/skaduwee/SkaduweeWorkerMale";
import SkaduweeWorkerFemale from "../prefabs/characters/skaduwee/SkaduweeWorkerFemale";
import FrostForge from "../prefabs/buildings/skaduwee/FrostForge";
import InfantryInn from "../prefabs/buildings/skaduwee/InfantryInn";
import Owlery from "../prefabs/buildings/skaduwee/Owlery";
import Tree1 from "../prefabs/outside/foliage/trees/resources/Tree1";
import Tree4 from "../prefabs/outside/foliage/trees/resources/Tree4";
import Tree5 from "../prefabs/outside/foliage/trees/resources/Tree5";
import Tree6 from "../prefabs/outside/foliage/trees/resources/Tree6";
import Tree7 from "../prefabs/outside/foliage/trees/resources/Tree7";
import Tree9 from "../prefabs/outside/foliage/trees/resources/Tree9";
import Tree10 from "../prefabs/outside/foliage/trees/resources/Tree10";
import Tree11 from "../prefabs/outside/foliage/trees/resources/Tree11";
import { ActorDefinition } from "@fuzzy-waddle/api-interfaces";
import { DepthHelper } from "../world/map/depth.helper";
import { getActorComponent } from "./actor-component";
import { OwnerComponent } from "../entity/actor/components/owner-component";
import { SelectableComponent } from "../entity/actor/components/selectable-component";
import StairsLeft from "../prefabs/buildings/tivara/wall/StairsLeft";
import WallBottomLeft from "../prefabs/buildings/tivara/wall/WallBottomLeft";
import WallBottomLeftBottomRight from "../prefabs/buildings/tivara/wall/WallBottomLeftBottomRight";
import StairsRight from "../prefabs/buildings/tivara/wall/StairsRight";
import WallBottomRight from "../prefabs/buildings/tivara/wall/WallBottomRight";
import WallEmpty from "../prefabs/buildings/tivara/wall/WallEmpty";
import WallTopLeft from "../prefabs/buildings/tivara/wall/WallTopLeft";
import WallTopLeftBottomLeft from "../prefabs/buildings/tivara/wall/WallTopLeftBottomLeft";
import WallTopLeftBottomRight from "../prefabs/buildings/tivara/wall/WallTopLeftBottomRight";
import WallTopLeftTopRight from "../prefabs/buildings/tivara/wall/WallTopLeftTopRight";
import WallTopRight from "../prefabs/buildings/tivara/wall/WallTopRight";
import WallTopRightBottomLeft from "../prefabs/buildings/tivara/wall/WallTopRightBottomLeft";
import WallTopRightBottomRight from "../prefabs/buildings/tivara/wall/WallTopRightBottomRight";
import WatchTower from "../prefabs/buildings/tivara/wall/WatchTower";
import { IdComponent } from "../entity/actor/components/id-component";
import { ObjectNames } from "./object-names";
import { setFullActorDataFromName, setMandatoryActorDataFromName } from "./actor-data";
import Minerals from "../prefabs/outside/resources/Minerals";
import Stone from "../../../other/Template/prefabs/Stone";
import GameObject = Phaser.GameObjects.GameObject;
import Transform = Phaser.GameObjects.Components.Transform;

export type ActorConstructor = new (scene: Phaser.Scene) => GameObject;
export type ActorMap = { [name: string]: ActorConstructor };
export class ActorManager {
  private static animals: ActorMap = {
    [ObjectNames.Hedgehog]: Hedgehog,
    [ObjectNames.Sheep]: Sheep
  };

  private static general: ActorMap = {
    [ObjectNames.GeneralWarrior]: GeneralWarrior
  };

  private static tivaraWorkers: ActorMap = {
    [ObjectNames.TivaraWorkerFemale]: TivaraWorkerFemale,
    [ObjectNames.TivaraWorkerMale]: TivaraWorkerMale
  };

  private static tivaraUnits: ActorMap = {
    [ObjectNames.TivaraMacemanMale]: TivaraMacemanMale,
    [ObjectNames.TivaraSlingshotFemale]: TivaraSlingshotFemale
  };

  private static tivaraBuildings: ActorMap = {
    [ObjectNames.AnkGuard]: AnkGuard,
    [ObjectNames.Olival]: Olival,
    [ObjectNames.Sandhold]: Sandhold,
    [ObjectNames.Temple]: Temple,
    [ObjectNames.WorkMill]: WorkMill
  };

  private static tivaraWall: ActorMap = {
    [ObjectNames.StairsLeft]: StairsLeft,
    [ObjectNames.StairsRight]: StairsRight,
    [ObjectNames.WallBottomLeft]: WallBottomLeft,
    [ObjectNames.WallBottomLeftBottomRight]: WallBottomLeftBottomRight,
    [ObjectNames.WallBottomRight]: WallBottomRight,
    [ObjectNames.WallEmpty]: WallEmpty,
    [ObjectNames.WallTopLeft]: WallTopLeft,
    [ObjectNames.WallTopLeftBottomLeft]: WallTopLeftBottomLeft,
    [ObjectNames.WallTopLeftBottomRight]: WallTopLeftBottomRight,
    [ObjectNames.WallTopLeftTopRight]: WallTopLeftTopRight,
    [ObjectNames.WallTopRight]: WallTopRight,
    [ObjectNames.WallTopRightBottomLeft]: WallTopRightBottomLeft,
    [ObjectNames.WallTopRightBottomRight]: WallTopRightBottomRight,
    [ObjectNames.WatchTower]: WatchTower
  };

  private static skaduweeWorkers: ActorMap = {
    [ObjectNames.SkaduweeWorkerMale]: SkaduweeWorkerMale,
    [ObjectNames.SkaduweeWorkerFemale]: SkaduweeWorkerFemale
  };
  private static skaduweeUnits: ActorMap = {
    [ObjectNames.SkaduweeOwl]: SkaduweeOwl,
    [ObjectNames.SkaduweeRangedFemale]: SkaduweeRangedFemale,
    [ObjectNames.SkaduweeMagicianFemale]: SkaduweeMagicianFemale,
    [ObjectNames.SkaduweeWarriorMale]: SkaduweeWarriorMale
  };

  private static skaduweeBuildings: ActorMap = {
    [ObjectNames.FrostForge]: FrostForge,
    [ObjectNames.InfantryInn]: InfantryInn,
    [ObjectNames.Owlery]: Owlery
  };

  private static resources: ActorMap = {
    [ObjectNames.Tree1]: Tree1,
    [ObjectNames.Tree4]: Tree4,
    [ObjectNames.Tree5]: Tree5,
    [ObjectNames.Tree6]: Tree6,
    [ObjectNames.Tree7]: Tree7,
    [ObjectNames.Tree9]: Tree9,
    [ObjectNames.Tree10]: Tree10,
    [ObjectNames.Tree11]: Tree11,
    [ObjectNames.Minerals]: Minerals,
    [ObjectNames.Stone]: Stone
  };

  public static actorMap: ActorMap = {
    ...ActorManager.animals,
    ...ActorManager.general,
    ...ActorManager.tivaraWorkers,
    ...ActorManager.tivaraUnits,
    ...ActorManager.tivaraBuildings,
    ...ActorManager.tivaraWall,
    ...ActorManager.skaduweeWorkers,
    ...ActorManager.skaduweeUnits,
    ...ActorManager.skaduweeBuildings,
    ...ActorManager.resources
  } as const;

  static getActorDefinitionFromActor(actor: GameObject): ActorDefinition | undefined {
    const actorName = actor.name;
    if (!this.actorMap[actorName]) {
      // console.error(`Actor ${actorName} not found`);
      return undefined;
    }
    const actorDefinition: ActorDefinition = {
      name: actorName
    };
    const transform = actor as any as Transform;
    if (transform.x !== undefined) actorDefinition.x = transform.x;
    if (transform.y !== undefined) actorDefinition.y = transform.y;
    if (transform.z !== undefined) actorDefinition.z = transform.z;
    const ownerComponent = getActorComponent(actor, OwnerComponent);
    if (ownerComponent) actorDefinition.owner = ownerComponent.getOwner();
    const selectableComponent = getActorComponent(actor, SelectableComponent);
    if (selectableComponent) actorDefinition.selectable = selectableComponent.getSelected();
    const idComponent = getActorComponent(actor, IdComponent);
    if (idComponent) actorDefinition.id = idComponent.id;

    // todo blackboard - create a blackboard component that can be added to actors

    return actorDefinition;
  }

  static createActorFully(scene: Phaser.Scene, name: ObjectNames, actorDefinition: ActorDefinition): GameObject {
    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(scene);
    setFullActorDataFromName(actor);
    ActorManager.setActorProperties(actor, actorDefinition);
    return actor;
  }

  /**
   * Used for spawning actors that are just shells, without any specific components and systems.
   * Use {@link upgradeFromMandatoryToFullActorData} to upgrade the actor to a full actor.
   * Use this method when you are using {@link BuildingCursor}
   */
  static createActorPartially(scene: Phaser.Scene, name: ObjectNames, actorDefinition: ActorDefinition): GameObject {
    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(scene);
    setMandatoryActorDataFromName(actor);
    ActorManager.setActorProperties(actor, actorDefinition);
    return actor;
  }

  static setActorProperties(actor: GameObject, properties: any) {
    const transform = actor as any as Transform;
    if (transform.x !== undefined && properties.x !== undefined) transform.x = properties.x;
    if (transform.y !== undefined && properties.y !== undefined) transform.y = properties.y;
    if (transform.z !== undefined && properties.z !== undefined) transform.z = properties.z;
    if (properties.owner) getActorComponent(actor, OwnerComponent)?.setOwner(properties.owner);
    if (properties.selectable) getActorComponent(actor, SelectableComponent)?.setSelected(properties.selectable);
    if (properties.id) getActorComponent(actor, IdComponent)?.setId(properties.id);
    DepthHelper.setActorDepth(actor);
  }
}
