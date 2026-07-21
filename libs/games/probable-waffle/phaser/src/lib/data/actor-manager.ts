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
import { type ActorDefinition, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "./actor-component";
import { OwnerComponent } from "../entity/components/owner-component";
import { SelectableComponent } from "../entity/components/selectable-component";
import WatchTower from "../prefabs/buildings/tivara/wall/WatchTower";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
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
type GameObject = Phaser.GameObjects.GameObject;
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
import CropsCabbage from "../prefabs/outside/crops/cabbage/CropsCabbage";
import CropsPeppers from "../prefabs/outside/crops/peppers/CropsPeppers";
import CropsBeans from "../prefabs/outside/crops/beans/CropsBeans";
import CropsCucumbers from "../prefabs/outside/crops/cucumbers/CropsCucumbers";
import CropsGrapes from "../prefabs/outside/crops/grapes/CropsGrapes";
import CropsLettuce from "../prefabs/outside/crops/lettuce/CropsLettuce";
import CropsPineapple from "../prefabs/outside/crops/pineapple/CropsPineapple";
import CropsPumpkin from "../prefabs/outside/crops/pumpkin/CropsPumpkin";
import CropsSunflowers from "../prefabs/outside/crops/sunflowers/CropsSunflowers";
import CropsWheat from "../prefabs/outside/crops/wheat/CropsWheat";
import CropsZucchini from "../prefabs/outside/crops/zucchini/CropsZucchini";
import GroundBoletus from "../prefabs/outside/crops/ground/boletus/GroundBoletus";
import GroundCarrot from "../prefabs/outside/crops/ground/carrot/GroundCarrot";
import GroundChampignons from "../prefabs/outside/crops/ground/champignons/GroundChampignons";
import GroundTurnip from "../prefabs/outside/crops/ground/turnip/GroundTurnip";
import Corpy from "../prefabs/characters/mobs/corpy/Corpy";
import { ScenarioActorReferenceComponent } from "../campaign/scenario/scenario-actor-reference.component";

import BlockObsidian1 from "../prefabs/outside/nature/block_obsidian/BlockObsidian1";
import BlockObsidian2 from "../prefabs/outside/nature/block_obsidian/BlockObsidian2";
import BlockObsidianLava1 from "../prefabs/outside/nature/block_obsidian_lava/BlockObsidianLava1";
import BlockObsidianLava2 from "../prefabs/outside/nature/block_obsidian_lava/BlockObsidianLava2";
import BlockObsidianLava3 from "../prefabs/outside/nature/block_obsidian_lava/BlockObsidianLava3";
import BlockObsidianLava4 from "../prefabs/outside/nature/block_obsidian_lava/BlockObsidianLava4";
import BlockObsidianLava5 from "../prefabs/outside/nature/block_obsidian_lava/BlockObsidianLava5";
import BlockStone1 from "../prefabs/outside/nature/block_stone/BlockStone1";
import BlockStone2 from "../prefabs/outside/nature/block_stone/BlockStone2";
import BlockStoneEmpty from "../prefabs/outside/nature/block_stone_grass/BlockStoneEmpty";
import BlockStoneGrassBottomLeft from "../prefabs/outside/nature/block_stone_grass/BlockStoneGrassBottomLeft";
import BlockStoneGrassBottomLeftBottomRight from "../prefabs/outside/nature/block_stone_grass/BlockStoneGrassBottomLeftBottomRight";
import BlockStoneGrassBottomRight from "../prefabs/outside/nature/block_stone_grass/BlockStoneGrassBottomRight";
import BlockStoneTopLeft from "../prefabs/outside/nature/block_stone_grass/BlockStoneTopLeft";
import BlockStoneTopLeftBottomLeft from "../prefabs/outside/nature/block_stone_grass/BlockStoneTopLeftBottomLeft";
import BlockStoneTopLeftTopRight from "../prefabs/outside/nature/block_stone_grass/BlockStoneTopLeftTopRight";
import BlockStoneTopRight from "../prefabs/outside/nature/block_stone_grass/BlockStoneTopRight";
import BlockStoneTopRightBottomRight from "../prefabs/outside/nature/block_stone_grass/BlockStoneTopRightBottomRight";
import BlockStoneWater1 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater1";
import BlockStoneWater2 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater2";
import BlockStoneWater3 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater3";
import BlockStoneWater4 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater4";
import BlockStoneWater5 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater5";
import BlockStoneWater6 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater6";
import ChimneyLarge from "../prefabs/outside/architecture/chimneys/ChimneyLarge";
import ChimneyShort from "../prefabs/outside/architecture/chimneys/ChimneyShort";
import ChristmasTree from "../prefabs/outside/foliage/trees/resources/special/ChristmasTree";
import CursedLandBones1 from "../prefabs/outside/environment/cursed_land/CursedLandBones1";
import CursedLandEyePlant1 from "../prefabs/outside/environment/cursed_land/CursedLandEyePlant1";
import CursedLandFetus1 from "../prefabs/outside/environment/cursed_land/CursedLandFetus1";
import CursedLandJawsPlant1 from "../prefabs/outside/environment/cursed_land/CursedLandJawsPlant1";
import CursedLandManyEyesPlant1 from "../prefabs/outside/environment/cursed_land/CursedLandManyEyesPlant1";
import CursedLandMeatFlower1 from "../prefabs/outside/environment/cursed_land/CursedLandMeatFlower1";
import CursedLandPustules1 from "../prefabs/outside/environment/cursed_land/CursedLandPustules1";
import CursedLandRock11 from "../prefabs/outside/environment/cursed_land/CursedLandRock11";
import CursedLandRock31 from "../prefabs/outside/environment/cursed_land/CursedLandRock31";
import CursedLandRockEyes1 from "../prefabs/outside/environment/cursed_land/CursedLandRockEyes1";
import CursedLandRuins1 from "../prefabs/outside/environment/cursed_land/CursedLandRuins1";
import CursedLandSpikePlant1 from "../prefabs/outside/environment/cursed_land/CursedLandSpikePlant1";
import CursedLandTentaclePlant1 from "../prefabs/outside/environment/cursed_land/CursedLandTentaclePlant1";
import CursedLandTubularPlant1 from "../prefabs/outside/environment/cursed_land/CursedLandTubularPlant1";
import CursedLandVeins1 from "../prefabs/outside/environment/cursed_land/CursedLandVeins1";
import DesertCactus from "../prefabs/outside/environment/desert/DesertCactus";
import DesertPalm from "../prefabs/outside/environment/desert/DesertPalm";
import DesertSandstone from "../prefabs/outside/environment/desert/DesertSandstone";
import DoorsLeft from "../prefabs/outside/architecture/blocks/DoorsLeft";
import DoorsRight from "../prefabs/outside/architecture/blocks/DoorsRight";
import FenceBottom from "../prefabs/outside/architecture/obstruction/FenceBottom";
import FenceBottomLeft from "../prefabs/outside/architecture/obstruction/FenceBottomLeft";
import FenceBottomRight from "../prefabs/outside/architecture/obstruction/FenceBottomRight";
import FenceTop from "../prefabs/outside/architecture/obstruction/FenceTop";
import FenceTopLeft from "../prefabs/outside/architecture/obstruction/FenceTopLeft";
import FenceTopRight from "../prefabs/outside/architecture/obstruction/FenceTopRight";
import GoblinBarrelLying from "../prefabs/outside/environment/goblin/GoblinBarrelLying";
import GoblinBarrelStanding from "../prefabs/outside/environment/goblin/GoblinBarrelStanding";
import GoblinBench from "../prefabs/outside/environment/goblin/GoblinBench";
import GoblinCart from "../prefabs/outside/environment/goblin/GoblinCart";
import GoblinCartTrack from "../prefabs/outside/environment/goblin/GoblinCartTrack";
import GoblinCartWithGold from "../prefabs/outside/environment/goblin/GoblinCartWithGold";
import GoblinCatapult from "../prefabs/outside/environment/goblin/GoblinCatapult";
import GoblinChestClosed from "../prefabs/outside/environment/goblin/GoblinChestClosed";
import GoblinChestEmpty from "../prefabs/outside/environment/goblin/GoblinChestEmpty";
import GoblinChestGold from "../prefabs/outside/environment/goblin/GoblinChestGold";
import GoblinChestMonster from "../prefabs/outside/environment/goblin/GoblinChestMonster";
import GoblinFenceBottom from "../prefabs/outside/environment/goblin/GoblinFenceBottom";
import GoblinFenceNwSe from "../prefabs/outside/environment/goblin/GoblinFenceNwSe";
import GoblinFire from "../prefabs/outside/environment/goblin/GoblinFire";
import GoblinFlag from "../prefabs/outside/environment/goblin/GoblinFlag";
import GoblinFlag1 from "../prefabs/outside/environment/goblin/GoblinFlag1";
import GoblinFlag2 from "../prefabs/outside/environment/goblin/GoblinFlag2";
import GoblinFlag3 from "../prefabs/outside/environment/goblin/GoblinFlag3";
import GoblinFlag4 from "../prefabs/outside/environment/goblin/GoblinFlag4";
import GoblinGold from "../prefabs/outside/environment/goblin/GoblinGold";
import GoblinGoldWithJewels from "../prefabs/outside/environment/goblin/GoblinGoldWithJewels";
import GoblinGrass1 from "../prefabs/outside/environment/goblin/GoblinGrass1";
import GoblinGrass2 from "../prefabs/outside/environment/goblin/GoblinGrass2";
import GoblinGrass3 from "../prefabs/outside/environment/goblin/GoblinGrass3";
import GoblinGrass4 from "../prefabs/outside/environment/goblin/GoblinGrass4";
import GoblinTile1 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTile1";
import GoblinTile2 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTile2";
import GoblinTile3 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTile3";
import GoblinTile4 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTile4";
import GoblinTileGrass1 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileGrass1";
import GoblinTileGrass2 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileGrass2";
import GoblinTileGrass3 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileGrass3";
import GoblinTileGrass4 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileGrass4";
import GoblinTileGrass5 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileGrass5";
import GoblinTileGrass6 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileGrass6";
import GoblinTileGrass7 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileGrass7";
import GoblinTileGrass8 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileGrass8";
import GoblinTileSoil1 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileSoil1";
import GoblinTileSoil2 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileSoil2";
import GoblinTileSoil3 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileSoil3";
import GoblinTileSoil4 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileSoil4";
import GoblinTileWater1 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileWater1";
import GoblinTileWater2 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileWater2";
import GoblinTileWater3 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileWater3";
import GoblinTileWater4 from "../prefabs/outside/environment/goblin/tall_tiles/GoblinTileWater4";
import Height1 from "../prefabs/outside/architecture/blocks/Height1";
import Height2 from "../prefabs/outside/architecture/blocks/Height2";
import Height3 from "../prefabs/outside/architecture/blocks/Height3";
import Height4 from "../prefabs/outside/architecture/blocks/Height4";
import Hollow from "../prefabs/outside/architecture/blocks/Hollow";
import HollowBottom from "../prefabs/outside/architecture/blocks/HollowBottom";
import HollowLeft from "../prefabs/outside/architecture/blocks/HollowLeft";
import HollowRight from "../prefabs/outside/architecture/blocks/HollowRight";
import HumidWhiteCrystal from "../prefabs/outside/environment/humid/HumidWhiteCrystal";
import LeavesLarge from "../prefabs/outside/foliage/bushes/LeavesLarge";
import LeavesSmall from "../prefabs/outside/foliage/bushes/LeavesSmall";
import RampStoneBottomLeft from "../prefabs/outside/nature/ramp/stone/RampStoneBottomLeft";
import RampStoneBottomRight from "../prefabs/outside/nature/ramp/stone/RampStoneBottomRight";
import RampStoneTopLeft from "../prefabs/outside/nature/ramp/stone/RampStoneTopLeft";
import RampStoneTopRight from "../prefabs/outside/nature/ramp/stone/RampStoneTopRight";
import Reeds1 from "../prefabs/outside/nature/grass/Reeds1";
import RockPiles1 from "../prefabs/outside/nature/rock_piles/RockPiles1";
import RockPiles2 from "../prefabs/outside/nature/rock_piles/RockPiles2";
import RockPiles3 from "../prefabs/outside/nature/rock_piles/RockPiles3";
import RockPiles5 from "../prefabs/outside/nature/rock_piles/RockPiles5";
import RockPiles6 from "../prefabs/outside/nature/rock_piles/RockPiles6";
import RockyStonePyramid3 from "../prefabs/outside/environment/rocky/RockyStonePyramid3";
import StoneEmpty from "../prefabs/outside/architecture/well/StoneEmpty";
import StoneFull from "../prefabs/outside/architecture/well/StoneFull";
import TallGrass0 from "../prefabs/outside/foliage/tall_grass/TallGrass0";
import TallGrass1 from "../prefabs/outside/foliage/tall_grass/TallGrass1";
import TallGrass2 from "../prefabs/outside/foliage/tall_grass/TallGrass2";
import TallGrass3 from "../prefabs/outside/foliage/tall_grass/TallGrass3";
import TallGrass4 from "../prefabs/outside/foliage/tall_grass/TallGrass4";
import TallGrass5 from "../prefabs/outside/foliage/tall_grass/TallGrass5";
import TallGrass6 from "../prefabs/outside/foliage/tall_grass/TallGrass6";
import TallGrass7 from "../prefabs/outside/foliage/tall_grass/TallGrass7";
import TreeTrunk from "../prefabs/outside/foliage/tree_trunks/TreeTrunk";
import UndeadLandBones1 from "../prefabs/outside/environment/undead_land/UndeadLandBones1";
import UndeadLandBrokenTree1 from "../prefabs/outside/environment/undead_land/UndeadLandBrokenTree1";
import UndeadLandCrystal1 from "../prefabs/outside/environment/undead_land/UndeadLandCrystal1";
import UndeadLandDeadArm1 from "../prefabs/outside/environment/undead_land/UndeadLandDeadArm1";
import UndeadLandDeadTree1 from "../prefabs/outside/environment/undead_land/UndeadLandDeadTree1";
import UndeadLandGrave1 from "../prefabs/outside/environment/undead_land/UndeadLandGrave1";
import UndeadLandPlant1 from "../prefabs/outside/environment/undead_land/UndeadLandPlant1";
import UndeadLandRock1 from "../prefabs/outside/environment/undead_land/UndeadLandRock1";
import UndeadLandRuin1 from "../prefabs/outside/environment/undead_land/UndeadLandRuin1";
import UndeadLandThornPlant1 from "../prefabs/outside/environment/undead_land/UndeadLandThornPlant1";
import UndeadLandTree1 from "../prefabs/outside/environment/undead_land/UndeadLandTree1";

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

  private static crops: ActorMap = {
    [ObjectNames.CropsBeans]: CropsBeans,
    [ObjectNames.CropsCabbage]: CropsCabbage,
    [ObjectNames.CropsCucumbers]: CropsCucumbers,
    [ObjectNames.CropsGrapes]: CropsGrapes,
    [ObjectNames.CropsLettuce]: CropsLettuce,
    [ObjectNames.CropsPeppers]: CropsPeppers,
    [ObjectNames.CropsPineapple]: CropsPineapple,
    [ObjectNames.CropsPumpkin]: CropsPumpkin,
    [ObjectNames.CropsSunflowers]: CropsSunflowers,
    [ObjectNames.CropsWheat]: CropsWheat,
    [ObjectNames.CropsZucchini]: CropsZucchini,
    [ObjectNames.GroundBoletus]: GroundBoletus,
    [ObjectNames.GroundCarrot]: GroundCarrot,
    [ObjectNames.GroundChampignons]: GroundChampignons,
    [ObjectNames.GroundTurnip]: GroundTurnip
  };

  private static general: ActorMap = {
    [ObjectNames.GeneralWarrior]: GeneralWarrior,
    [ObjectNames.Centurion]: Centurion,
    [ObjectNames.VikingBoat]: VikingBoat,
    [ObjectNames.CommonBoat]: CommonBoat
  };

  private static mobs: ActorMap = {
    [ObjectNames.Cyclops]: Cyclops,
    [ObjectNames.Corpy]: Corpy,
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

  private static environmentActors: ActorMap = {
    [ObjectNames.BlockObsidian1]: BlockObsidian1,
    [ObjectNames.BlockObsidian2]: BlockObsidian2,
    [ObjectNames.BlockObsidianLava1]: BlockObsidianLava1,
    [ObjectNames.BlockObsidianLava2]: BlockObsidianLava2,
    [ObjectNames.BlockObsidianLava3]: BlockObsidianLava3,
    [ObjectNames.BlockObsidianLava4]: BlockObsidianLava4,
    [ObjectNames.BlockObsidianLava5]: BlockObsidianLava5,
    [ObjectNames.BlockStone1]: BlockStone1,
    [ObjectNames.BlockStone2]: BlockStone2,
    [ObjectNames.BlockStoneEmpty]: BlockStoneEmpty,
    [ObjectNames.BlockStoneGrassBottomLeft]: BlockStoneGrassBottomLeft,
    [ObjectNames.BlockStoneGrassBottomLeftBottomRight]: BlockStoneGrassBottomLeftBottomRight,
    [ObjectNames.BlockStoneGrassBottomRight]: BlockStoneGrassBottomRight,
    [ObjectNames.BlockStoneTopLeft]: BlockStoneTopLeft,
    [ObjectNames.BlockStoneTopLeftBottomLeft]: BlockStoneTopLeftBottomLeft,
    [ObjectNames.BlockStoneTopLeftTopRight]: BlockStoneTopLeftTopRight,
    [ObjectNames.BlockStoneTopRight]: BlockStoneTopRight,
    [ObjectNames.BlockStoneTopRightBottomRight]: BlockStoneTopRightBottomRight,
    [ObjectNames.BlockStoneWater1]: BlockStoneWater1,
    [ObjectNames.BlockStoneWater2]: BlockStoneWater2,
    [ObjectNames.BlockStoneWater3]: BlockStoneWater3,
    [ObjectNames.BlockStoneWater4]: BlockStoneWater4,
    [ObjectNames.BlockStoneWater5]: BlockStoneWater5,
    [ObjectNames.BlockStoneWater6]: BlockStoneWater6,
    [ObjectNames.ChimneyLarge]: ChimneyLarge,
    [ObjectNames.ChimneyShort]: ChimneyShort,
    [ObjectNames.ChristmasTree]: ChristmasTree,
    [ObjectNames.CursedLandBones1]: CursedLandBones1,
    [ObjectNames.CursedLandEyePlant1]: CursedLandEyePlant1,
    [ObjectNames.CursedLandFetus1]: CursedLandFetus1,
    [ObjectNames.CursedLandJawsPlant1]: CursedLandJawsPlant1,
    [ObjectNames.CursedLandManyEyesPlant1]: CursedLandManyEyesPlant1,
    [ObjectNames.CursedLandMeatFlower1]: CursedLandMeatFlower1,
    [ObjectNames.CursedLandPustules1]: CursedLandPustules1,
    [ObjectNames.CursedLandRock11]: CursedLandRock11,
    [ObjectNames.CursedLandRock31]: CursedLandRock31,
    [ObjectNames.CursedLandRockEyes1]: CursedLandRockEyes1,
    [ObjectNames.CursedLandRuins1]: CursedLandRuins1,
    [ObjectNames.CursedLandSpikePlant1]: CursedLandSpikePlant1,
    [ObjectNames.CursedLandTentaclePlant1]: CursedLandTentaclePlant1,
    [ObjectNames.CursedLandTubularPlant1]: CursedLandTubularPlant1,
    [ObjectNames.CursedLandVeins1]: CursedLandVeins1,
    [ObjectNames.DesertCactus]: DesertCactus,
    [ObjectNames.DesertPalm]: DesertPalm,
    [ObjectNames.DesertSandstone]: DesertSandstone,
    [ObjectNames.DoorsLeft]: DoorsLeft,
    [ObjectNames.DoorsRight]: DoorsRight,
    [ObjectNames.FenceBottom]: FenceBottom,
    [ObjectNames.FenceBottomLeft]: FenceBottomLeft,
    [ObjectNames.FenceBottomRight]: FenceBottomRight,
    [ObjectNames.FenceTop]: FenceTop,
    [ObjectNames.FenceTopLeft]: FenceTopLeft,
    [ObjectNames.FenceTopRight]: FenceTopRight,
    [ObjectNames.GoblinBarrelLying]: GoblinBarrelLying,
    [ObjectNames.GoblinBarrelStanding]: GoblinBarrelStanding,
    [ObjectNames.GoblinBench]: GoblinBench,
    [ObjectNames.GoblinCart]: GoblinCart,
    [ObjectNames.GoblinCartTrack]: GoblinCartTrack,
    [ObjectNames.GoblinCartWithGold]: GoblinCartWithGold,
    [ObjectNames.GoblinCatapult]: GoblinCatapult,
    [ObjectNames.GoblinChestClosed]: GoblinChestClosed,
    [ObjectNames.GoblinChestEmpty]: GoblinChestEmpty,
    [ObjectNames.GoblinChestGold]: GoblinChestGold,
    [ObjectNames.GoblinChestMonster]: GoblinChestMonster,
    [ObjectNames.GoblinFenceBottom]: GoblinFenceBottom,
    [ObjectNames.GoblinFenceNwSe]: GoblinFenceNwSe,
    [ObjectNames.GoblinFire]: GoblinFire,
    [ObjectNames.GoblinFlag]: GoblinFlag,
    [ObjectNames.GoblinFlag1]: GoblinFlag1,
    [ObjectNames.GoblinFlag2]: GoblinFlag2,
    [ObjectNames.GoblinFlag3]: GoblinFlag3,
    [ObjectNames.GoblinFlag4]: GoblinFlag4,
    [ObjectNames.GoblinGold]: GoblinGold,
    [ObjectNames.GoblinGoldWithJewels]: GoblinGoldWithJewels,
    [ObjectNames.GoblinGrass1]: GoblinGrass1,
    [ObjectNames.GoblinGrass2]: GoblinGrass2,
    [ObjectNames.GoblinGrass3]: GoblinGrass3,
    [ObjectNames.GoblinGrass4]: GoblinGrass4,
    [ObjectNames.GoblinTile1]: GoblinTile1,
    [ObjectNames.GoblinTile2]: GoblinTile2,
    [ObjectNames.GoblinTile3]: GoblinTile3,
    [ObjectNames.GoblinTile4]: GoblinTile4,
    [ObjectNames.GoblinTileGrass1]: GoblinTileGrass1,
    [ObjectNames.GoblinTileGrass2]: GoblinTileGrass2,
    [ObjectNames.GoblinTileGrass3]: GoblinTileGrass3,
    [ObjectNames.GoblinTileGrass4]: GoblinTileGrass4,
    [ObjectNames.GoblinTileGrass5]: GoblinTileGrass5,
    [ObjectNames.GoblinTileGrass6]: GoblinTileGrass6,
    [ObjectNames.GoblinTileGrass7]: GoblinTileGrass7,
    [ObjectNames.GoblinTileGrass8]: GoblinTileGrass8,
    [ObjectNames.GoblinTileSoil1]: GoblinTileSoil1,
    [ObjectNames.GoblinTileSoil2]: GoblinTileSoil2,
    [ObjectNames.GoblinTileSoil3]: GoblinTileSoil3,
    [ObjectNames.GoblinTileSoil4]: GoblinTileSoil4,
    [ObjectNames.GoblinTileWater1]: GoblinTileWater1,
    [ObjectNames.GoblinTileWater2]: GoblinTileWater2,
    [ObjectNames.GoblinTileWater3]: GoblinTileWater3,
    [ObjectNames.GoblinTileWater4]: GoblinTileWater4,
    [ObjectNames.Height1]: Height1,
    [ObjectNames.Height2]: Height2,
    [ObjectNames.Height3]: Height3,
    [ObjectNames.Height4]: Height4,
    [ObjectNames.Hollow]: Hollow,
    [ObjectNames.HollowBottom]: HollowBottom,
    [ObjectNames.HollowLeft]: HollowLeft,
    [ObjectNames.HollowRight]: HollowRight,
    [ObjectNames.HumidWhiteCrystal]: HumidWhiteCrystal,
    [ObjectNames.LeavesLarge]: LeavesLarge,
    [ObjectNames.LeavesSmall]: LeavesSmall,
    [ObjectNames.RampStoneBottomLeft]: RampStoneBottomLeft,
    [ObjectNames.RampStoneBottomRight]: RampStoneBottomRight,
    [ObjectNames.RampStoneTopLeft]: RampStoneTopLeft,
    [ObjectNames.RampStoneTopRight]: RampStoneTopRight,
    [ObjectNames.Reeds1]: Reeds1,
    [ObjectNames.RockPiles1]: RockPiles1,
    [ObjectNames.RockPiles2]: RockPiles2,
    [ObjectNames.RockPiles3]: RockPiles3,
    [ObjectNames.RockPiles5]: RockPiles5,
    [ObjectNames.RockPiles6]: RockPiles6,
    [ObjectNames.RockyStonePyramid3]: RockyStonePyramid3,
    [ObjectNames.StoneEmpty]: StoneEmpty,
    [ObjectNames.StoneFull]: StoneFull,
    [ObjectNames.TallGrass0]: TallGrass0,
    [ObjectNames.TallGrass1]: TallGrass1,
    [ObjectNames.TallGrass2]: TallGrass2,
    [ObjectNames.TallGrass3]: TallGrass3,
    [ObjectNames.TallGrass4]: TallGrass4,
    [ObjectNames.TallGrass5]: TallGrass5,
    [ObjectNames.TallGrass6]: TallGrass6,
    [ObjectNames.TallGrass7]: TallGrass7,
    [ObjectNames.TreeTrunk]: TreeTrunk,
    [ObjectNames.UndeadLandBones1]: UndeadLandBones1,
    [ObjectNames.UndeadLandBrokenTree1]: UndeadLandBrokenTree1,
    [ObjectNames.UndeadLandCrystal1]: UndeadLandCrystal1,
    [ObjectNames.UndeadLandDeadArm1]: UndeadLandDeadArm1,
    [ObjectNames.UndeadLandDeadTree1]: UndeadLandDeadTree1,
    [ObjectNames.UndeadLandGrave1]: UndeadLandGrave1,
    [ObjectNames.UndeadLandPlant1]: UndeadLandPlant1,
    [ObjectNames.UndeadLandRock1]: UndeadLandRock1,
    [ObjectNames.UndeadLandRuin1]: UndeadLandRuin1,
    [ObjectNames.UndeadLandThornPlant1]: UndeadLandThornPlant1,
    [ObjectNames.UndeadLandTree1]: UndeadLandTree1
  };

  private static spells: ActorMap = {
    [ObjectNames.HealingTotem]: HealingTotem
  };

  public static actorMap: ActorMap = {
    ...ActorManager.animals,
    ...ActorManager.crops,
    ...ActorManager.general,
    ...ActorManager.mobs,
    ...ActorManager.tivaraWorkers,
    ...ActorManager.tivaraUnits,
    ...ActorManager.tivaraBuildings,
    ...ActorManager.skaduweeWorkers,
    ...ActorManager.skaduweeUnits,
    ...ActorManager.skaduweeBuildings,
    ...ActorManager.resources,
    ...ActorManager.environmentActors,
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
      scenario: getActorComponent(actor, ScenarioActorReferenceComponent)?.getData(),
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
    sceneActorCreator.registerAndSaveNewActor(actor, actorDefinition.id?.id);
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
    sceneActorCreator.registerAndSaveNewActor(actor, actorDefinition.id?.id);
    return actor;
  }
}
