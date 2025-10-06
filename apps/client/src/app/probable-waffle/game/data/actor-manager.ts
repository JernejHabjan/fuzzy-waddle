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
import { ActorDefinition, ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "./actor-component";
import { OwnerComponent } from "../entity/actor/components/owner-component";
import { SelectableComponent } from "../entity/actor/components/selectable-component";
import WatchTower from "../prefabs/buildings/tivara/wall/WatchTower";
import { IdComponent } from "../entity/actor/components/id-component";
import { setConstructingActorDataFromName, setCoreActorDataFromName, setFullActorDataFromName } from "./actor-data";
import Minerals from "../prefabs/outside/resources/Minerals";
import { ConstructionSiteComponent } from "../entity/building/construction/construction-site-component";
import { HealthComponent } from "../entity/combat/components/health-component";
import Wall from "../prefabs/buildings/tivara/wall/Wall";
import Stairs from "../prefabs/buildings/tivara/stairs/Stairs";
import StonePile from "../prefabs/outside/resources/StonePile";
import { SkaduweeWorker } from "../prefabs/characters/skaduwee/SkaduweeWorker";
import { TivaraWorker } from "../prefabs/characters/tivara/TivaraWorker";
import { pwActorDefinitions } from "./actor-definitions";
import { RepresentableComponent } from "../entity/actor/components/representable-component";
import { VisionComponent } from "../entity/actor/components/vision-component";
import { AttackComponent } from "../entity/combat/components/attack-component";
import { HealingComponent } from "../entity/combat/components/healing-component";
import { BuilderComponent } from "../entity/actor/components/builder-component";
import { GathererComponent } from "../entity/actor/components/gatherer-component";
import { ContainerComponent } from "../entity/building/container-component";
import { ResourceDrainComponent } from "../entity/economy/resource/resource-drain-component";
import { ResourceSourceComponent } from "../entity/economy/resource/resource-source-component";
import { ProductionComponent } from "../entity/building/production/production-component";
import { PawnAiController } from "../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import GameObject = Phaser.GameObjects.GameObject;
import { getSceneService } from "../scenes/components/scene-component-helpers";
import { SceneActorCreator } from "../scenes/components/scene-actor-creator";
import { HousingComponent } from "../entity/building/housing-component";

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
    [ObjectNames.TivaraWorker]: TivaraWorker,
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
    [ObjectNames.Stairs]: Stairs,
    [ObjectNames.WatchTower]: WatchTower,
    [ObjectNames.Wall]: Wall
  };

  private static skaduweeWorkers: ActorMap = {
    [ObjectNames.SkaduweeWorker]: SkaduweeWorker,
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
    [ObjectNames.StonePile]: StonePile
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
    const actorName = actor.name as ObjectNames;
    if (!this.actorMap[actorName]) {
      // console.error(`Actor ${actorName} not found`);
      return undefined;
    }
    // noinspection UnnecessaryLocalVariableJS
    const actorDefinition: ActorDefinition = {
      name: actorName,
      owner: getActorComponent(actor, OwnerComponent)?.getData(),
      selected: getActorComponent(actor, SelectableComponent)?.getData(),
      id: getActorComponent(actor, IdComponent)?.getData(),
      constructionSite: getActorComponent(actor, ConstructionSiteComponent)?.getData(),
      health: getActorComponent(actor, HealthComponent)?.getData(),
      housing: getActorComponent(actor, HousingComponent)?.getData(),
      vision: getActorComponent(actor, VisionComponent)?.getData(),
      attack: getActorComponent(actor, AttackComponent)?.getData(),
      healing: getActorComponent(actor, HealingComponent)?.getData(),
      builder: getActorComponent(actor, BuilderComponent)?.getData(),
      gatherer: getActorComponent(actor, GathererComponent)?.getData(),
      container: getActorComponent(actor, ContainerComponent)?.getData(),
      resourceDrain: getActorComponent(actor, ResourceDrainComponent)?.getData(),
      resourceSource: getActorComponent(actor, ResourceSourceComponent)?.getData(),
      production: getActorComponent(actor, ProductionComponent)?.getData(),
      representable: getActorComponent(actor, RepresentableComponent)?.getData(),
      blackboard: getActorComponent(actor, PawnAiController)?.getData()
    };

    return actorDefinition;
  }

  static createActorFully(scene: Phaser.Scene, name: ObjectNames, actorDefinition: ActorDefinition): GameObject {
    const definition = pwActorDefinitions[name as ObjectNames];
    if (!definition) {
      throw new Error(`Actor definition for ${name} not found.`);
    }

    if (definition.meta?.randomOfType?.length) {
      // If the actor definition has a randomOfType, we need to pick a random one from the list
      const randomIndex = Math.floor(Math.random() * definition.meta.randomOfType.length);
      name = definition.meta.randomOfType[randomIndex] as ObjectNames;
    }

    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(scene);
    setFullActorDataFromName(actor, actorDefinition);
    return actor;
  }

  /**
   * Used for spawning actors that are just shells, without any specific components and systems.
   * Use {@link upgradeFromCoreToConstructingActorData} to upgrade the actor to a constructing actor.
   * Use this method when you are using {@link BuildingCursor}
   */
  static createActorCore(
    scene: Phaser.Scene,
    name: ObjectNames,
    actorDefinition: Partial<ActorDefinition>
  ): GameObject {
    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(scene);
    setCoreActorDataFromName(actor, actorDefinition);
    const sceneActorCreator = getSceneService(scene, SceneActorCreator);
    if (!sceneActorCreator) {
      throw new Error("SceneActorCreator not found in scene");
    }
    sceneActorCreator.registerAndSaveNewActor(actor);
    return actor;
  }

  /**
   * Used when skipping building cursor, and you want to create foundation actor.
   * Use {@link upgradeFromConstructingToFullActorData} to upgrade the actor to a fully functioning actor.
   */
  static createActorConstructing(
    scene: Phaser.Scene,
    name: ObjectNames,
    actorDefinition: Partial<ActorDefinition>
  ): GameObject {
    let actor: GameObject | undefined = undefined;
    const actorConstructor = this.actorMap[name];
    if (!actorConstructor) {
      console.error(`Actor ${name} not found`);
      throw new Error(`Actor ${name} not found`);
    }
    actor = new actorConstructor(scene);
    setCoreActorDataFromName(actor, actorDefinition);
    setConstructingActorDataFromName(actor, actorDefinition);
    return actor;
  }
}
