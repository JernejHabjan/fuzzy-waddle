import Hedgehog from "../prefabs/animals/hedgehog/Hedgehog";
import Sheep from "../prefabs/animals/sheep/Sheep";
import GeneralWarrior from "../prefabs/characters/general/general-warrior/GeneralWarrior";
import TivaraMacemanMale from "../prefabs/characters/tivara/tivara-maceman-male/TivaraMacemanMale";
import TivaraSlingshotFemale from "../prefabs/characters/tivara/tivara-slingshot-female/TivaraSlingshotFemale";
import TivaraWorkerFemale from "../prefabs/characters/tivara/tivara-worker/tivara-worker-female/TivaraWorkerFemale";
import TivaraWorkerMale from "../prefabs/characters/tivara/tivara-worker/tivara-worker-male/TivaraWorkerMale";
import AnkGuard from "../prefabs/buildings/tivara/AnkGuard";
import Olival from "../prefabs/buildings/tivara/Olival";
import Sandhold from "../prefabs/buildings/tivara/Sandhold";
import Temple from "../prefabs/buildings/tivara/Temple";
import WorkMill from "../prefabs/buildings/tivara/WorkMill";
import SkaduweeOwl from "../prefabs/characters/skaduwee/skaduwee-owl/SkaduweeOwl";
import SkaduweeRangedFemale from "../prefabs/characters/skaduwee/skaduwee-ranged-female/SkaduweeRangedFemale";
import SkaduweeMagicianFemale from "../prefabs/characters/skaduwee/skaduwee-magician-female/SkaduweeMagicianFemale";
import SkaduweeWarriorMale from "../prefabs/characters/skaduwee/skaduwee-warrior-male/SkaduweeWarriorMale";
import SkaduweeWorkerMale from "../prefabs/characters/skaduwee/skaduwee-worker/skaduwee-worker-male/SkaduweeWorkerMale";
import SkaduweeWorkerFemale from "../prefabs/characters/skaduwee/skaduwee-worker/skaduwee-worker-female/SkaduweeWorkerFemale";
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
import { type ActorDefinition, ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "./actor-component";
import { OwnerComponent } from "../entity/components/owner-component";
import { SelectableComponent } from "../entity/components/selectable-component";
import WatchTower from "../prefabs/buildings/tivara/wall/WatchTower";
import { IdComponent } from "../entity/components/id-component";
import { setConstructingActorDataFromName, setCoreActorDataFromName, setFullActorDataFromName } from "./actor-data";
import Minerals from "../prefabs/outside/resources/minerals/Minerals";
import { ConstructionSiteComponent } from "../entity/components/construction/construction-site-component";
import { HealthComponent } from "../entity/components/combat/components/health-component";
import Wall from "../prefabs/buildings/tivara/wall/Wall";
import Stairs from "../prefabs/buildings/tivara/stairs/Stairs";
import StonePile from "../prefabs/outside/resources/stone-pile/StonePile";
import { SkaduweeWorker } from "../prefabs/characters/skaduwee/skaduwee-worker/SkaduweeWorker";
import { TivaraWorker } from "../prefabs/characters/tivara/tivara-worker/TivaraWorker";
import { getPwActorDefinition } from "../prefabs/definitions/actor-definitions";
import { RepresentableComponent } from "../entity/components/representable-component";
import { VisionComponent } from "../entity/components/vision-component";
import { AttackComponent } from "../entity/components/combat/components/attack-component";
import { HealingComponent } from "../entity/components/combat/components/healing-component";
import { BuilderComponent } from "../entity/components/construction/builder-component";
import { GathererComponent } from "../entity/components/resource/gatherer-component";
import { ContainerComponent } from "../entity/components/building/container-component";
import { ResourceDrainComponent } from "../entity/components/resource/resource-drain-component";
import { ResourceSourceComponent } from "../entity/components/resource/resource-source-component";
import { ProductionComponent } from "../entity/components/production/production-component";
import { PawnAiController } from "../prefabs/ai-agents/pawn-ai-controller";
import { HousingComponent } from "../entity/components/building/housing-component";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SceneActorCreator } from "../world/services/scene-actor-creator";
import MiningCamp from "../prefabs/buildings/tivara/MiningCamp";
import Emberstone from "../prefabs/buildings/skaduwee/Emberstone";
import Granary from "../prefabs/buildings/shared/Granary";
import Field from "../prefabs/buildings/shared/Field";
import { SpellComponent } from "../entity/components/combat/components/spell-component";
import { StatusEffectComponent } from "../entity/components/status-effect/status-effect-component";
import { ResearchComponent } from "../entity/components/research/research-component";
import { LevelComponent } from "../entity/components/level/level-component";
import Wolf from "../prefabs/animals/wolf/Wolf";
import Boar from "../prefabs/animals/boar/Boar";
import Stag from "../prefabs/animals/stag/Stag";
import Badger from "../prefabs/animals/badger/Badger";
import Centurion from "../prefabs/characters/general/centurion/Centurion";
import Minotaur from "../prefabs/characters/mobs/minotaur/Minotaur";
import Cyclops from "../prefabs/characters/mobs/cyclops/Cyclops";
import Mummy from "../prefabs/characters/mobs/mummy/Mummy";
import OrcBoomerang from "../prefabs/characters/mobs/orcs/orc_boomerang/OrcBoomerang";
import OrcMagician from "../prefabs/characters/mobs/orcs/orc_magician/OrcMagician";
import OrcWarrior from "../prefabs/characters/mobs/orcs/orc_warrior/OrcWarrior";
import PirateSwordsman from "../prefabs/characters/mobs/pirates/pirate_swordsman/PirateSwordsman";
import SkeletonBowman from "../prefabs/characters/mobs/skeleton/skeleton_bowman/SkeletonBowman";
import SkeletonMelee from "../prefabs/characters/mobs/skeleton/skeleton_melee/SkeletonMelee";
import PirateScimitar from "../prefabs/characters/mobs/pirates/pirate_scimitar/PirateScimitar";
import SkeletonScythe from "../prefabs/characters/mobs/skeleton/skeleton_scythe/SkeletonScythe";
import Zombie1 from "../prefabs/characters/mobs/zombies/zombie1/Zombie1";
import Zombie2 from "../prefabs/characters/mobs/zombies/zombie2/Zombie2";
import SkeletonSwordsman from "../prefabs/characters/mobs/skeleton/skeleton_swordsman/SkeletonSwordsman";
import Zombie3 from "../prefabs/characters/mobs/zombies/zombie3/Zombie3";
import { RandomService } from "../world/services/random.service";
import HealingTotem from "../prefabs/buildings/tivara/HealingTotem/HealingTotem";
import TivaraAlchemist from "../prefabs/characters/tivara/tivara-alchemist/TivaraAlchemist";
import Hare from "../prefabs/animals/hare/Hare";
import Deer from "../prefabs/animals/deer/Deer";
import Boar2 from "../prefabs/animals/boar2/Boar2";
import Turkey from "../prefabs/animals/turkey/Turkey";
import BlackGrouse from "../prefabs/animals/black_grouse/BlackGrouse";
import Fox from "../prefabs/animals/fox/Fox";
import Sheep2 from "../prefabs/animals/sheep2/Sheep2";
import Rooster from "../prefabs/animals/rooster/Rooster";
import Chick from "../prefabs/animals/chick/Chick";
import Calf from "../prefabs/animals/calf/Calf";
import Bull from "../prefabs/animals/bull/Bull";
import Lamb from "../prefabs/animals/lamb/Lamb";
import Piglet from "../prefabs/animals/piglet/Piglet";
import GameObject = Phaser.GameObjects.GameObject;
import Banshee from "../prefabs/characters/mobs/banshee/Banshee";
import BigWaterSlime from "../prefabs/characters/mobs/big_water_slime/BigWaterSlime";
import SmallWaterSlime from "../prefabs/characters/mobs/small_water_slime/SmallWaterSlime";
import FireSlime from "../prefabs/characters/mobs/fire_slime/FireSlime";
import StoneGolem from "../prefabs/characters/mobs/stone_golem/StoneGolem";
import MetalGolem from "../prefabs/characters/mobs/metal_golem/MetalGolem";
import EarthGolem from "../prefabs/characters/mobs/earth_golem/EarthGolem";
import Medusa from "../prefabs/characters/mobs/medusa/Medusa";
import Minotaur2 from "../prefabs/characters/mobs/minotaur2/Minotaur2";
import FlyingDemonRed from "../prefabs/characters/mobs/flying_demon_red/FlyingDemonRed";
import FlowerMonster from "../prefabs/characters/mobs/flower_monster/FlowerMonster";
import FlyingDemonBlue from "../prefabs/characters/mobs/flying_demon_blue/FlyingDemonBlue";
import MushroomWarrior from "../prefabs/characters/mobs/mushroom_warrior/MushroomWarrior";
import PumpkinWarlock from "../prefabs/characters/mobs/pumpkin_warlock/PumpkinWarlock";
import PumpkinWarlockBat from "../prefabs/characters/mobs/pumpkin_warlock_bat/PumpkinWarlockBat";
import PumpkinWarlockPumpkin from "../prefabs/characters/mobs/pumpkin_warlock_pumpkin/PumpkinWarlockPumpkin";
import SandWorm from "../prefabs/characters/mobs/sand_worm/SandWorm";
import ForestWendigo from "../prefabs/characters/mobs/forest_wendigo/ForestWendigo";
import SnowWendigo from "../prefabs/characters/mobs/snow_wendigo/SnowWendigo";
import VikingBoat from "../prefabs/characters/shared/VikingBoat/VikingBoat";
import CommonBoat from "../prefabs/characters/shared/CommonBoat/CommonBoat";

type ActorMap = { [name: string]: new (scene: Phaser.Scene) => GameObject };
export class ActorManager {
  private static animals: ActorMap = {
    [ObjectNames.Hedgehog]: Hedgehog,
    [ObjectNames.Sheep]: Sheep,
    [ObjectNames.Wolf]: Wolf,
    [ObjectNames.Boar]: Boar,
    [ObjectNames.Stag]: Stag,
    [ObjectNames.Badger]: Badger,
    [ObjectNames.Bull]: Bull,
    [ObjectNames.Calf]: Calf,
    [ObjectNames.Chick]: Chick,
    [ObjectNames.Lamb]: Lamb,
    [ObjectNames.Piglet]: Piglet,
    [ObjectNames.Rooster]: Rooster,
    [ObjectNames.Sheep2]: Sheep2,
    [ObjectNames.Turkey]: Turkey,
    [ObjectNames.Black_grouse]: BlackGrouse,
    [ObjectNames.Boar2]: Boar2,
    [ObjectNames.Deer]: Deer,
    [ObjectNames.Fox]: Fox,
    [ObjectNames.Hare]: Hare
  };

  private static general: ActorMap = {
    [ObjectNames.GeneralWarrior]: GeneralWarrior,
    [ObjectNames.Centurion]: Centurion,
    [ObjectNames.VikingBoat]: VikingBoat,
    [ObjectNames.CommonBoat]: CommonBoat
  };

  private static mobs: ActorMap = {
    [ObjectNames.Cyclops]: Cyclops,
    [ObjectNames.Minotaur]: Minotaur,
    [ObjectNames.Mummy]: Mummy,
    [ObjectNames.OrcBoomerang]: OrcBoomerang,
    [ObjectNames.OrcMagician]: OrcMagician,
    [ObjectNames.OrcWarrior]: OrcWarrior,
    [ObjectNames.PirateScimitar]: PirateScimitar,
    [ObjectNames.PirateSwordsman]: PirateSwordsman,
    [ObjectNames.SkeletonBowman]: SkeletonBowman,
    [ObjectNames.SkeletonMelee]: SkeletonMelee,
    [ObjectNames.SkeletonScythe]: SkeletonScythe,
    [ObjectNames.SkeletonSwordsman]: SkeletonSwordsman,
    [ObjectNames.Zombie1]: Zombie1,
    [ObjectNames.Zombie2]: Zombie2,
    [ObjectNames.Zombie3]: Zombie3,
    [ObjectNames.Banshee]: Banshee,
    [ObjectNames.FlowerMonster]: FlowerMonster,
    [ObjectNames.FlyingDemonBlue]: FlyingDemonBlue,
    [ObjectNames.FlyingDemonRed]: FlyingDemonRed,
    [ObjectNames.EarthGolem]: EarthGolem,
    [ObjectNames.StoneGolem]: StoneGolem,
    [ObjectNames.MetalGolem]: MetalGolem,
    [ObjectNames.Medusa]: Medusa,
    [ObjectNames.Minotaur2]: Minotaur2,
    [ObjectNames.MushroomWarrior]: MushroomWarrior,
    [ObjectNames.PumpkinWarlock]: PumpkinWarlock,
    [ObjectNames.PumpkinWarlockBat]: PumpkinWarlockBat,
    [ObjectNames.PumpkinWarlockPumpkin]: PumpkinWarlockPumpkin,
    [ObjectNames.SandWorm]: SandWorm,
    [ObjectNames.SmallWaterSlime]: SmallWaterSlime,
    [ObjectNames.BigWaterSlime]: BigWaterSlime,
    [ObjectNames.FireSlime]: FireSlime,
    [ObjectNames.SnowWendigo]: SnowWendigo,
    [ObjectNames.ForestWendigo]: ForestWendigo
  };

  private static tivaraWorkers: ActorMap = {
    [ObjectNames.TivaraWorker]: TivaraWorker,
    [ObjectNames.TivaraWorkerFemale]: TivaraWorkerFemale,
    [ObjectNames.TivaraWorkerMale]: TivaraWorkerMale
  };

  private static tivaraUnits: ActorMap = {
    [ObjectNames.TivaraMacemanMale]: TivaraMacemanMale,
    [ObjectNames.TivaraSlingshotFemale]: TivaraSlingshotFemale,
    [ObjectNames.TivaraAlchemist]: TivaraAlchemist
  };

  private static tivaraBuildings: ActorMap = {
    [ObjectNames.AnkGuard]: AnkGuard,
    [ObjectNames.Olival]: Olival,
    [ObjectNames.Sandhold]: Sandhold,
    [ObjectNames.Temple]: Temple,
    [ObjectNames.Stairs]: Stairs,
    [ObjectNames.WatchTower]: WatchTower,
    [ObjectNames.Wall]: Wall,
    [ObjectNames.WorkMill]: WorkMill,
    [ObjectNames.MiningCamp]: MiningCamp,
    [ObjectNames.Granary]: Granary,
    [ObjectNames.Field]: Field
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
    [ObjectNames.Owlery]: Owlery,
    [ObjectNames.Emberstone]: Emberstone,
    [ObjectNames.WorkMill]: WorkMill,
    [ObjectNames.WatchTower]: WatchTower,
    [ObjectNames.Wall]: Wall,
    [ObjectNames.Stairs]: Stairs,
    [ObjectNames.MiningCamp]: MiningCamp,
    [ObjectNames.Granary]: Granary,
    [ObjectNames.Field]: Field
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

  private static spells: ActorMap = {
    [ObjectNames.HealingTotem]: HealingTotem
  };

  public static actorMap: ActorMap = {
    ...ActorManager.animals,
    ...ActorManager.general,
    ...ActorManager.mobs,
    ...ActorManager.tivaraWorkers,
    ...ActorManager.tivaraUnits,
    ...ActorManager.tivaraBuildings,
    ...ActorManager.skaduweeWorkers,
    ...ActorManager.skaduweeUnits,
    ...ActorManager.skaduweeBuildings,
    ...ActorManager.resources,
    ...ActorManager.spells
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
      research: getActorComponent(actor, ResearchComponent)?.getData(),
      representable: getActorComponent(actor, RepresentableComponent)?.getData(),
      blackboard: getActorComponent(actor, PawnAiController)?.getData(),
      spell: getActorComponent(actor, SpellComponent)?.getData(),
      statusEffects: getActorComponent(actor, StatusEffectComponent)?.getData(),
      level: getActorComponent(actor, LevelComponent)?.getData()
    } satisfies ActorDefinition;

    return actorDefinition;
  }

  static createActorFully(scene: Phaser.Scene, name: ObjectNames, actorDefinition: ActorDefinition): GameObject {
    const definition = getPwActorDefinition(name, null);
    if (!definition) {
      throw new Error(`Actor definition for ${name} not found.`);
    }

    if (definition.meta?.randomOfType?.length) {
      // If the actor definition has a randomOfType, we need to pick a random one from the list
      const randomService = getSceneService(scene, RandomService)!;
      name = randomService.pick(definition.meta.randomOfType) as ObjectNames;
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

    const sceneActorCreator = getSceneService(scene, SceneActorCreator);
    if (!sceneActorCreator) {
      throw new Error("SceneActorCreator not found in scene");
    }
    sceneActorCreator.registerAndSaveNewActor(actor);
    return actor;
  }
}
