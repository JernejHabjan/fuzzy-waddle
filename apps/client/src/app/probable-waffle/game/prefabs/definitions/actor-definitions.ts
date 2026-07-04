import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { PrefabDefinition } from "./prefab-definition";
import { applyLevelOverrides } from "./prefab-definition";
import { tivaraWorkerDefinition } from "../characters/tivara/tivara-worker/tivara-worker.definition";
import { skaduweeWorkerDefinition } from "../characters/skaduwee/skaduwee-worker/skaduwee-worker.definition";
import { skaduweeWorkerMaleDefinition } from "../characters/skaduwee/skaduwee-worker/skaduwee-worker-male/skaduwee-worker-male.definition";
import { skaduweeWorkerFemaleDefinition } from "../characters/skaduwee/skaduwee-worker/skaduwee-worker-female/skaduwee-worker-female.definition";
import { frostForgeDefinition } from "../buildings/skaduwee/FrostForge/frost-forge.definition";
import { infantryInnDefinition } from "../buildings/skaduwee/InfantryInn/infantry-inn.definition";
import { wallDefinition } from "../buildings/tivara/wall/wall.definition";
import { watchTowerDefinition } from "../buildings/tivara/WatchTower/watch-tower.definition";
import { stairsDefinition } from "../buildings/tivara/stairs/stairs.definition";
import { ankGuardDefinition } from "../buildings/tivara/AnkGuard/ank-guard.definition";
import { olivalDefinition } from "../buildings/tivara/Olival/olival.definition";
import { sandholdDefinition } from "../buildings/tivara/Sandhold/sandhold.definition";
import { templeDefinition } from "../buildings/tivara/Temple/temple.definition";
import { workMillDefinition } from "../buildings/tivara/WorkMill/work-mill.definition";
import { miningCampDefinition } from "../buildings/tivara/MiningCamp/mining-camp.definition";
import { granaryDefinition } from "../buildings/shared/Granary/granary.definition";
import { fieldDefinition } from "../buildings/shared/Field/field.definition";
import { owleryDefinition } from "../buildings/skaduwee/Owlery/owlery.definition";
import { hedgehogDefinition } from "../animals/hedgehog/hedgehog.definition";
import { sheepDefinition } from "../animals/sheep/sheep.definition";
import { badgerDefinition } from "../animals/badger/badger.definition";
import { tivaraSlingshotFemaleDefinition } from "../characters/tivara/tivara-slingshot-female/tivara-slingshot-female.definition";
import { skaduweeOwlDefinition } from "../characters/skaduwee/skaduwee-owl/skaduwee-owl.definition";
import { skaduweeRangedFemaleDefinition } from "../characters/skaduwee/skaduwee-ranged-female/skaduwee-ranged-female.definition";
import { skaduweeMagicianFemaleDefinition } from "../characters/skaduwee/skaduwee-magician-female/skaduwee-magician-female.definition";
import { skaduweeWarriorMaleDefinition } from "../characters/skaduwee/skaduwee-warrior-male/skaduwee-warrior-male.definition";
import { tivaraWorkerFemaleDefinition } from "../characters/tivara/tivara-worker/tivara-worker-female/tivara-worker-female.definition";
import { tivaraWorkerMaleDefinition } from "../characters/tivara/tivara-worker/tivara-worker-male/tivara-worker-male.definition";
import { tivaraMacemanMaleDefinition } from "../characters/tivara/tivara-maceman-male/tivara-maceman-male.definition";
import { generalWarriorDefinition } from "../characters/general/general-warrior/general-warrior.definition";
import { wolfDefinition } from "../animals/wolf/wolf.definition";
import { stagDefinition } from "../animals/stag/stag.definition";
import { boarDefinition } from "../animals/boar/boar.definition";
import { tree1Definition } from "../outside/foliage/trees/resources/tree1.definition";
import { tree4Definition } from "../outside/foliage/trees/resources/tree4.definition";
import { tree5Definition } from "../outside/foliage/trees/resources/tree5.definition";
import { tree6Definition } from "../outside/foliage/trees/resources/tree6.definition";
import { tree7Definition } from "../outside/foliage/trees/resources/tree7.definition";
import { tree9Definition } from "../outside/foliage/trees/resources/tree9.definition";
import { tree10Definition } from "../outside/foliage/trees/resources/tree10.definition";
import { tree11Definition } from "../outside/foliage/trees/resources/tree11.definition";
import { mineralsDefinition } from "../outside/resources/minerals/minerals.definition";
import { stonePileDefinition } from "../outside/resources/stone-pile/stone-pile.definition";
import { emberstoneDefinition } from "../buildings/skaduwee/Emberstone/emberstone.definition";
import {
  cropsBeanDefinition,
  cropsCabbageDefinition,
  cropsCucumbersDefinition,
  cropsGrapesDefinition,
  cropsLettuceDefinition,
  cropsPeppersDefinition,
  cropsPineappleDefinition,
  cropsPumpkinDefinition,
  cropsSunflowersDefinition,
  cropsWheatDefinition,
  cropsZucchiniDefinition,
  groundBoletusDefinition,
  groundCarrotDefinition,
  groundChampignonsDefinition,
  groundTurnipDefinition
} from "../outside/crops/crops.definition";
import { centurionDefinition } from "../characters/general/centurion/centurion.definition";
import { cyclopsDefinition } from "../characters/mobs/cyclops/cyclops.definition";
import { minotaurDefinition } from "../characters/mobs/minotaur/minotaur.definition";
import { orcWarriorDefinition } from "../characters/mobs/orcs/orc_warrior/orc-warrior.definition";
import { pirateSwordsmanDefinition } from "../characters/mobs/pirates/pirate_swordsman/pirate-swordsman.definition";
import { zombie1Definition } from "../characters/mobs/zombies/zombie1/zombie1.definition";
import { zombie2Definition } from "../characters/mobs/zombies/zombie2/zombie2.definition";
import { orcBoomerangDefinition } from "../characters/mobs/orcs/orc_boomerang/orc-boomerang.definition";
import { zombie3Definition } from "../characters/mobs/zombies/zombie3/zombie3.definition";
import { skeletonSwordsmanDefinition } from "../characters/mobs/skeleton/skeleton_swordsman/skeleton-swordsman.definition";
import { skeletonScytheDefinition } from "../characters/mobs/skeleton/skeleton_scythe/skeleton-scythe.definition";
import { skeletonMeleeDefinition } from "../characters/mobs/skeleton/skeleton_melee/skeleton-melee.definition";
import { skeletonBowmanDefinition } from "../characters/mobs/skeleton/skeleton_bowman/skeleton-bowman.definition";
import { pirateScimitarDefinition } from "../characters/mobs/pirates/pirate_scimitar/pirate-scimitar.definition";
import { orcMagicianDefinition } from "../characters/mobs/orcs/orc_magician/orc-magician.definition";
import { mummyDefinition } from "../characters/mobs/mummy/mummy.definition";
import { healingTotemDefinition } from "../buildings/tivara/HealingTotem/healing-totem.definition";
import { tivaraAlchemistDefinition } from "../characters/tivara/tivara-alchemist/tivara_alchemist.definition";
import { roosterDefinition } from "../animals/rooster/rooster.definition";
import { pigletDefinition } from "../animals/piglet/piglet.definition";
import { chickDefinition } from "../animals/chick/chick.definition";
import { bullDefinition } from "../animals/bull/bull.definition";
import { calfDefinition } from "../animals/calf/calf.definition";
import { lambDefinition } from "../animals/lamb/lamb.definition";
import { hareDefinition } from "../animals/hare/hare.definition";
import { sheep2Definition } from "../animals/sheep2/sheep2.definition";
import { turkeyDefinition } from "../animals/turkey/turkey.definition";
import { blackGrouseDefinition } from "../animals/black_grouse/black_grouse.definition";
import { boar2Definition } from "../animals/boar2/boar2.definition";
import { deerDefinition } from "../animals/deer/deer.definition";
import { foxDefinition } from "../animals/fox/fox.definition";
import { sandWormDefinition } from "../characters/mobs/sand_worm/sand_worm.definition";
import { mushroomWarriorDefinition } from "../characters/mobs/mushroom_warrior/mushroom_warrior.definition";
import { medusaDefinition } from "../characters/mobs/medusa/medusa.definition";
import { stoneGolemDefinition } from "../characters/mobs/stone_golem/stone_golem.definition";
import { metalGolemDefinition } from "../characters/mobs/metal_golem/metal_golem.definition";
import { flyingDemonRedDefinition } from "../characters/mobs/flying_demon_red/flying_demon_red.definition";
import { flowerMonsterDefinition } from "../characters/mobs/flower_monster/flower_monster.definition";
import { bansheeDefinition } from "../characters/mobs/banshee/banshee.definition";
import { fireSlimeDefinition } from "../characters/mobs/fire_slime/fire_slime.definition";
import { pumpkinWarlockDefinition } from "../characters/mobs/pumpkin_warlock/pumpkin_warlock.definition";
import { forestWendigoDefinition } from "../characters/mobs/forest_wendigo/forest_wendigo.definition";
import { minotaur2Definition } from "../characters/mobs/minotaur2/minotaur2.definition";
import { flyingDemonBlueDefinition } from "../characters/mobs/flying_demon_blue/flying_demon_blue.definition";
import { smallWaterSlimeDefinition } from "../characters/mobs/small_water_slime/small_water_slime.definition";
import { bigWaterSlimeDefinition } from "../characters/mobs/big_water_slime/big_water_slime.definition";
import { snowWendigoDefinition } from "../characters/mobs/snow_wendigo/snow_wendigo.definition";
import { earthGolemDefinition } from "../characters/mobs/earth_golem/earth_golem.definition";
import { pumpkinWarlockBatDefinition } from "../characters/mobs/pumpkin_warlock_bat/pumpkin_warlock_bat.definition";
import { pumpkinWarlockPumpkinDefinition } from "../characters/mobs/pumpkin_warlock_pumpkin/pumpkin_warlock_pumpkin.definition";
import { vikingBoatDefinition } from "../characters/shared/VikingBoat/viking_boat.definition";
import { commonBoatDefinition } from "../characters/shared/CommonBoat/common_boat.definition";

export const pwActorDefinitions: {
  [key in ObjectNames]: PrefabDefinition;
} = {
  // Animals
  Hedgehog: hedgehogDefinition,
  Sheep: sheepDefinition,
  Badger: badgerDefinition,
  Boar: boarDefinition,
  Stag: stagDefinition,
  Wolf: wolfDefinition,
  Bull: bullDefinition,
  Calf: calfDefinition,
  Chick: chickDefinition,
  Lamb: lambDefinition,
  Piglet: pigletDefinition,
  Rooster: roosterDefinition,
  Sheep2: sheep2Definition,
  Turkey: turkeyDefinition,
  Black_grouse: blackGrouseDefinition,
  Boar2: boar2Definition,
  Deer: deerDefinition,
  Fox: foxDefinition,
  Hare: hareDefinition,
  // Units - mobs and generic
  GeneralWarrior: generalWarriorDefinition,
  CommonBoat: commonBoatDefinition,
  VikingBoat: vikingBoatDefinition,
  Centurion: centurionDefinition,
  Cyclops: cyclopsDefinition,
  Minotaur: minotaurDefinition,
  Mummy: mummyDefinition,
  OrcBoomerang: orcBoomerangDefinition,
  OrcMagician: orcMagicianDefinition,
  OrcWarrior: orcWarriorDefinition,
  PirateScimitar: pirateScimitarDefinition,
  PirateSwordsman: pirateSwordsmanDefinition,
  SkeletonBowman: skeletonBowmanDefinition,
  SkeletonMelee: skeletonMeleeDefinition,
  SkeletonScythe: skeletonScytheDefinition,
  SkeletonSwordsman: skeletonSwordsmanDefinition,
  Zombie1: zombie1Definition,
  Zombie2: zombie2Definition,
  Zombie3: zombie3Definition,
  Banshee: bansheeDefinition,
  FlowerMonster: flowerMonsterDefinition,
  FlyingDemonBlue: flyingDemonBlueDefinition,
  FlyingDemonRed: flyingDemonRedDefinition,
  EarthGolem: earthGolemDefinition,
  StoneGolem: stoneGolemDefinition,
  MetalGolem: metalGolemDefinition,
  Medusa: medusaDefinition,
  Minotaur2: minotaur2Definition,
  MushroomWarrior: mushroomWarriorDefinition,
  PumpkinWarlock: pumpkinWarlockDefinition,
  PumpkinWarlockBat: pumpkinWarlockBatDefinition,
  PumpkinWarlockPumpkin: pumpkinWarlockPumpkinDefinition,
  SandWorm: sandWormDefinition,
  SmallWaterSlime: smallWaterSlimeDefinition,
  BigWaterSlime: bigWaterSlimeDefinition,
  FireSlime: fireSlimeDefinition,
  SnowWendigo: snowWendigoDefinition,
  ForestWendigo: forestWendigoDefinition,
  // Tivara
  // Tivara buildings
  Sandhold: sandholdDefinition,
  AnkGuard: ankGuardDefinition,
  Olival: olivalDefinition,
  Temple: templeDefinition,
  // Tivara units
  TivaraMacemanMale: tivaraMacemanMaleDefinition,
  TivaraAlchemist: tivaraAlchemistDefinition,
  TivaraSlingshotFemale: tivaraSlingshotFemaleDefinition,
  TivaraWorker: tivaraWorkerDefinition,
  TivaraWorkerFemale: tivaraWorkerFemaleDefinition,
  TivaraWorkerMale: tivaraWorkerMaleDefinition,
  // Skaduwee
  // Skaduwee buildings
  FrostForge: frostForgeDefinition,
  Emberstone: emberstoneDefinition,
  InfantryInn: infantryInnDefinition,
  Owlery: owleryDefinition,
  // Skaduwee units
  SkaduweeOwl: skaduweeOwlDefinition,
  SkaduweeRangedFemale: skaduweeRangedFemaleDefinition,
  SkaduweeMagicianFemale: skaduweeMagicianFemaleDefinition,
  SkaduweeWarriorMale: skaduweeWarriorMaleDefinition,
  SkaduweeWorkerMale: skaduweeWorkerMaleDefinition,
  SkaduweeWorker: skaduweeWorkerDefinition,
  SkaduweeWorkerFemale: skaduweeWorkerFemaleDefinition,
  // Shared faction
  WorkMill: workMillDefinition,
  MiningCamp: miningCampDefinition,
  Granary: granaryDefinition,
  Field: fieldDefinition,
  Stairs: stairsDefinition,
  WatchTower: watchTowerDefinition,
  Wall: wallDefinition,
  // Resources
  Minerals: mineralsDefinition,
  StonePile: stonePileDefinition,
  // Trees
  Tree1: tree1Definition,
  Tree4: tree4Definition,
  Tree5: tree5Definition,
  Tree6: tree6Definition,
  Tree7: tree7Definition,
  Tree9: tree9Definition,
  Tree10: tree10Definition,
  Tree11: tree11Definition,
  // Crops
  CropsBeans: cropsBeanDefinition,
  CropsCabbage: cropsCabbageDefinition,
  CropsCucumbers: cropsCucumbersDefinition,
  CropsGrapes: cropsGrapesDefinition,
  CropsLettuce: cropsLettuceDefinition,
  CropsPeppers: cropsPeppersDefinition,
  CropsPineapple: cropsPineappleDefinition,
  CropsPumpkin: cropsPumpkinDefinition,
  CropsSunflowers: cropsSunflowersDefinition,
  CropsWheat: cropsWheatDefinition,
  CropsZucchini: cropsZucchiniDefinition,
  GroundBoletus: groundBoletusDefinition,
  GroundCarrot: groundCarrotDefinition,
  GroundChampignons: groundChampignonsDefinition,
  GroundTurnip: groundTurnipDefinition,
  // Spells
  HealingTotem: healingTotemDefinition
};

/**
 * Returns the actor definition for the given name, optionally with level overrides applied.
 * Use this everywhere instead of direct pwActorDefinitions[name] access.
 * @param name - The actor ObjectName
 * @param level - The level to apply overrides for (> 1 triggers level-specific overrides), or null for base definition
 */
export function getPwActorDefinition(name: ObjectNames | string, level: number | null): PrefabDefinition | undefined {
  const base = pwActorDefinitions[name as ObjectNames];
  if (!base) return undefined;
  if (!level || level <= 1) return base;
  return applyLevelOverrides(base, level);
}
