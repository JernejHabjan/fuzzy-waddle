// You can write more code here

/* START OF COMPILED CODE */

import GameProbableWaffleScene from "./GameProbableWaffleScene";
import Spawn from "../prefabs/buildings/misc/Spawn";
import EditorOwner from "../editor-components/EditorOwner";
import Wall from "../prefabs/buildings/tivara/wall/Wall";
import ChristmasTree from "../prefabs/outside/foliage/trees/resources/special/ChristmasTree";
import Sheep from "../prefabs/animals/sheep/Sheep";
import Hedgehog from "../prefabs/animals/hedgehog/Hedgehog";
import Tree7 from "../prefabs/outside/foliage/trees/resources/Tree7";
import Owlery from "../prefabs/buildings/skaduwee/Owlery";
import InfantryInn from "../prefabs/buildings/skaduwee/InfantryInn";
import AnkGuard from "../prefabs/buildings/tivara/AnkGuard";
import Temple from "../prefabs/buildings/tivara/Temple";
import SkaduweeWorkerMale from "../prefabs/characters/skaduwee/SkaduweeWorkerMale";
import SkaduweeWorkerFemale from "../prefabs/characters/skaduwee/SkaduweeWorkerFemale";
import SkaduweeRangedFemale from "../prefabs/characters/skaduwee/SkaduweeRangedFemale";
import SkaduweeWarriorMale from "../prefabs/characters/skaduwee/SkaduweeWarriorMale";
import GeneralWarrior from "../prefabs/characters/general/GeneralWarrior";
import TivaraSlingshotFemale from "../prefabs/characters/tivara/TivaraSlingshotFemale";
import TallGrass1 from "../prefabs/outside/foliage/tall_grass/TallGrass1";
import Olival from "../prefabs/buildings/tivara/Olival";
import WatchTower from "../prefabs/buildings/tivara/wall/WatchTower";
import BushDownwardsSmall from "../prefabs/outside/foliage/bushes/BushDownwardsSmall";
import BushDownwardsLarge from "../prefabs/outside/foliage/bushes/BushDownwardsLarge";
import BridgeStone from "../prefabs/outside/architecture/river/BridgeStone";
import BlockStone2 from "../prefabs/outside/nature/block_stone/BlockStone2";
import BlockStone1 from "../prefabs/outside/nature/block_stone/BlockStone1";
import BlockStoneTopRightBottomRight from "../prefabs/outside/nature/block_stone_grass/BlockStoneTopRightBottomRight";
import TreeTrunk from "../prefabs/outside/foliage/tree_trunks/TreeTrunk";
import RampStoneTopRight from "../prefabs/outside/nature/ramp/stone/RampStoneTopRight";
import RockPiles5 from "../prefabs/outside/nature/rock_piles/RockPiles5";
import RockPiles2 from "../prefabs/outside/nature/rock_piles/RockPiles2";
import RockPiles3 from "../prefabs/outside/nature/rock_piles/RockPiles3";
import Tree4 from "../prefabs/outside/foliage/trees/resources/Tree4";
import Tree6 from "../prefabs/outside/foliage/trees/resources/Tree6";
import Tree1 from "../prefabs/outside/foliage/trees/resources/Tree1";
import Tree5 from "../prefabs/outside/foliage/trees/resources/Tree5";
import BushDry from "../prefabs/outside/foliage/bushes/BushDry";
import BushUpwardsSmall from "../prefabs/outside/foliage/bushes/BushUpwardsSmall";
import WorkMill from "../prefabs/buildings/tivara/WorkMill";
import BlockStoneWater1 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater1";
import BlockStoneWater4 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater4";
import BlockStoneWater3 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater3";
import SkaduweeOwl from "../prefabs/units/skaduwee/SkaduweeOwl";
import Tree10 from "../prefabs/outside/foliage/trees/resources/Tree10";
import Tree9 from "../prefabs/outside/foliage/trees/resources/Tree9";
import Tree11 from "../prefabs/outside/foliage/trees/resources/Tree11";
import FenceTop from "../prefabs/outside/architecture/obstruction/FenceTop";
import FenceTopRight from "../prefabs/outside/architecture/obstruction/FenceTopRight";
import FenceTopLeft from "../prefabs/outside/architecture/obstruction/FenceTopLeft";
import FenceBottomLeft from "../prefabs/outside/architecture/obstruction/FenceBottomLeft";
import FenceBottomRight from "../prefabs/outside/architecture/obstruction/FenceBottomRight";
import FenceBottom from "../prefabs/outside/architecture/obstruction/FenceBottom";
import StonePile from "../prefabs/outside/resources/StonePile";
import Minerals from "../prefabs/outside/resources/Minerals";
import TallGrass3 from "../prefabs/outside/foliage/tall_grass/TallGrass3";
import TallGrass7 from "../prefabs/outside/foliage/tall_grass/TallGrass7";
import TallGrass2 from "../prefabs/outside/foliage/tall_grass/TallGrass2";
import TallGrass6 from "../prefabs/outside/foliage/tall_grass/TallGrass6";
import TallGrass4 from "../prefabs/outside/foliage/tall_grass/TallGrass4";
import TallGrass0 from "../prefabs/outside/foliage/tall_grass/TallGrass0";
import TallGrass5 from "../prefabs/outside/foliage/tall_grass/TallGrass5";
import Reeds1 from "../prefabs/outside/nature/grass/Reeds1";
import TivaraWorkerFemale from "../prefabs/characters/tivara/TivaraWorkerFemale";
import TivaraWorkerMale from "../prefabs/characters/tivara/TivaraWorkerMale";
import Stairs from "../prefabs/buildings/tivara/stairs/Stairs";
import SoundEffectMarker from "../prefabs/buildings/misc/SoundEffectMarker";
import SkaduweeMagicianFemale from "../prefabs/characters/skaduwee/SkaduweeMagicianFemale";
import FenceRightCorner from "../prefabs/outside/architecture/obstruction/FenceRightCorner";
import FenceLeftCorner from "../prefabs/outside/architecture/obstruction/FenceLeftCorner";
import ToxicFrog from "../prefabs/animals/toxic-frog/ToxicFrog";
import TreeBird from "../prefabs/animals/tree-bird/TreeBird";
import Wolf from "../prefabs/animals/wolf/Wolf";
import Stag from "../prefabs/animals/stag/Stag";
import Boar from "../prefabs/animals/boar/Boar";
import Badger from "../prefabs/animals/badger/Badger";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class MapRiverCrossing extends GameProbableWaffleScene {
  constructor() {
    super("MapRiverCrossing");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // tilemap
    const tilemap = this.add.tilemap("tiles_river_crossing");
    tilemap.addTilesetImage("tiles", "tiles_1");
    tilemap.addTilesetImage("tiles_2", "tiles_2");

    // tilemap_level_1
    tilemap.createLayer("TileMap_level_1", ["tiles", "tiles_2"], 0, 0);

    // spawn
    const spawn = new Spawn(this, 96, 608);
    this.add.existing(spawn);

    // wall_6
    const wall_6 = new Wall(this, -448, 256);
    this.add.existing(wall_6);

    // christmasTree
    const christmasTree = new ChristmasTree(this, -288, 1200);
    this.add.existing(christmasTree);

    // spawn_1
    const spawn_1 = new Spawn(this, 1248, 800);
    this.add.existing(spawn_1);

    // christmasTree_1
    const christmasTree_1 = new ChristmasTree(this, -128, 1184);
    this.add.existing(christmasTree_1);

    // sheep_2
    const sheep_2 = new Sheep(this, -184, 1272);
    this.add.existing(sheep_2);

    // hedgehog
    const hedgehog = new Hedgehog(this, 256, 1376);
    this.add.existing(hedgehog);

    // tree_11
    const tree_11 = new Tree7(this, 160, 1328);
    this.add.existing(tree_11);

    // wall_7
    const wall_7 = new Wall(this, -416, 272);
    this.add.existing(wall_7);

    // owlery
    const owlery = new Owlery(this, 992, 880);
    this.add.existing(owlery);

    // infantryInn
    const infantryInn = new InfantryInn(this, 1088, 928);
    this.add.existing(infantryInn);

    // ankGuard
    const ankGuard = new AnkGuard(this, 0, 336);
    this.add.existing(ankGuard);

    // temple
    const temple = new Temple(this, -160, 464);
    this.add.existing(temple);

    // skaduweeWorkerMale
    const skaduweeWorkerMale = new SkaduweeWorkerMale(this, 1472, 816);
    this.add.existing(skaduweeWorkerMale);

    // skaduweeWorkerFemale
    const skaduweeWorkerFemale = new SkaduweeWorkerFemale(this, 512, 864);
    this.add.existing(skaduweeWorkerFemale);

    // skaduweeRangedFemale
    const skaduweeRangedFemale = new SkaduweeRangedFemale(this, 1344, 704);
    this.add.existing(skaduweeRangedFemale);

    // skaduweeWarriorMale
    const skaduweeWarriorMale = new SkaduweeWarriorMale(this, 1504, 816);
    this.add.existing(skaduweeWarriorMale);

    // generalWarrior
    const generalWarrior = new GeneralWarrior(this, 128, 1360);
    this.add.existing(generalWarrior);

    // tivaraSlingshotFemale
    const tivaraSlingshotFemale = new TivaraSlingshotFemale(this, -256, 528);
    this.add.existing(tivaraSlingshotFemale);

    // tallGrass_7
    const tallGrass_7 = new TallGrass1(this, -144, 832);
    this.add.existing(tallGrass_7);

    // olival
    const olival = new Olival(this, 128, 768);
    this.add.existing(olival);

    // watchTower
    const watchTower = new WatchTower(this, -352, 288);
    this.add.existing(watchTower);

    // bushDownwardsSmall
    const bushDownwardsSmall = new BushDownwardsSmall(this, -832, 464);
    this.add.existing(bushDownwardsSmall);

    // bushDownwardsLarge
    const bushDownwardsLarge = new BushDownwardsLarge(this, -576, 400);
    this.add.existing(bushDownwardsLarge);

    // bridgeStone
    const bridgeStone = new BridgeStone(this, -64, 864);
    this.add.existing(bridgeStone);

    // blockStone
    const blockStone = new BlockStone2(this, 0, 32);
    this.add.existing(blockStone);

    // blockStone1
    const blockStone1 = new BlockStone1(this, 64, 32);
    this.add.existing(blockStone1);

    // blockStone_1
    const blockStone_1 = new BlockStone1(this, -32, 48);
    this.add.existing(blockStone_1);

    // blockStone_2
    const blockStone_2 = new BlockStone2(this, 32, 48);
    this.add.existing(blockStone_2);

    // blockStone_3
    const blockStone_3 = new BlockStone2(this, 0, 64);
    this.add.existing(blockStone_3);

    // blockStoneTopRightBottomRight
    const blockStoneTopRightBottomRight = new BlockStoneTopRightBottomRight(this, -64, 64);
    this.add.existing(blockStoneTopRightBottomRight);

    // blockStone_4
    const blockStone_4 = new BlockStone1(this, -32, 80);
    this.add.existing(blockStone_4);

    // treeTrunk
    const treeTrunk = new TreeTrunk(this, -672, 528);
    this.add.existing(treeTrunk);

    // rampStoneTopRight
    const rampStoneTopRight = new RampStoneTopRight(this, -64, 80);
    this.add.existing(rampStoneTopRight);

    // blockStone_5
    const blockStone_5 = new BlockStone2(this, 32, -16);
    this.add.existing(blockStone_5);

    // blockStone_6
    const blockStone_6 = new BlockStone2(this, 64, 0);
    this.add.existing(blockStone_6);

    // rockPiles5
    const rockPiles5 = new RockPiles5(this, 64, 160);
    this.add.existing(rockPiles5);

    // blockStone_7
    const blockStone_7 = new BlockStone2(this, 128, 160);
    this.add.existing(blockStone_7);

    // blockStone_8
    const blockStone_8 = new BlockStone2(this, 128, 128);
    this.add.existing(blockStone_8);

    // blockStone_9
    const blockStone_9 = new BlockStone2(this, 128, 96);
    this.add.existing(blockStone_9);

    // blockStone_10
    const blockStone_10 = new BlockStone2(this, 128, 64);
    this.add.existing(blockStone_10);

    // blockStone_11
    const blockStone_11 = new BlockStone2(this, 128, 32);
    this.add.existing(blockStone_11);

    // rockPiles2
    const rockPiles2 = new RockPiles2(this, 160, 176);
    this.add.existing(rockPiles2);

    // rockPiles3
    const rockPiles3 = new RockPiles3(this, 96, 176);
    this.add.existing(rockPiles3);

    // rockPiles
    const rockPiles = new RockPiles2(this, 128, 192);
    this.add.existing(rockPiles);

    // tree4
    const tree4 = new Tree4(this, 128, 0);
    this.add.existing(tree4);

    // tree7
    const tree7 = new Tree7(this, -736, 400);
    this.add.existing(tree7);

    // tree6
    const tree6 = new Tree6(this, -672, 400);
    this.add.existing(tree6);

    // tree_1
    const tree_1 = new Tree7(this, -608, 448);
    this.add.existing(tree_1);

    // tree_2
    const tree_2 = new Tree4(this, -832, 864);
    this.add.existing(tree_2);

    // tree1
    const tree1 = new Tree1(this, -1152, 800);
    this.add.existing(tree1);

    // tree_3
    const tree_3 = new Tree4(this, -448, 960);
    this.add.existing(tree_3);

    // treeTrunk_1
    const treeTrunk_1 = new TreeTrunk(this, -784, 880);
    this.add.existing(treeTrunk_1);

    // tree_4
    const tree_4 = new Tree5(this, 448, 1328);
    this.add.existing(tree_4);

    // tree_5
    const tree_5 = new Tree6(this, 40, 1432);
    this.add.existing(tree_5);

    // bushDry
    const bushDry = new BushDry(this, 768, 1040);
    this.add.existing(bushDry);

    // bushDry_1
    const bushDry_1 = new BushDry(this, -1056, 944);
    this.add.existing(bushDry_1);

    // bushDry_2
    const bushDry_2 = new BushDry(this, 416, 800);
    this.add.existing(bushDry_2);

    // bushDry_3
    const bushDry_3 = new BushDry(this, -224, 160);
    this.add.existing(bushDry_3);

    // bushUpwardsSmall
    const bushUpwardsSmall = new BushUpwardsSmall(this, -128, 80);
    this.add.existing(bushUpwardsSmall);

    // bushDownwardsSmall_1
    const bushDownwardsSmall_1 = new BushDownwardsSmall(this, 224, 1312);
    this.add.existing(bushDownwardsSmall_1);

    // bushUpwardsSmall_1
    const bushUpwardsSmall_1 = new BushUpwardsSmall(this, 32, 1440);
    this.add.existing(bushUpwardsSmall_1);

    // bushDry_4
    const bushDry_4 = new BushDry(this, -1024, 768);
    this.add.existing(bushDry_4);

    // tree
    const tree = new Tree5(this, -704, 480);
    this.add.existing(tree);

    // workMill
    const workMill = new WorkMill(this, -544, 512);
    this.add.existing(workMill);

    // blockStone_12
    const blockStone_12 = new BlockStone1(this, 384, 976);
    this.add.existing(blockStone_12);

    // blockStoneWater1
    const blockStoneWater1 = new BlockStoneWater1(this, 416, 928);
    this.add.existing(blockStoneWater1);

    // blockStoneWater4
    const blockStoneWater4 = new BlockStoneWater4(this, 384, 944);
    this.add.existing(blockStoneWater4);

    // blockStoneWater3
    const blockStoneWater3 = new BlockStoneWater3(this, 448, 976);
    this.add.existing(blockStoneWater3);

    // blockStoneWater
    const blockStoneWater = new BlockStoneWater4(this, 416, 992);
    this.add.existing(blockStoneWater);

    // rockPiles_1
    const rockPiles_1 = new RockPiles5(this, 352, 992);
    this.add.existing(rockPiles_1);

    // tree_6
    const tree_6 = new Tree7(this, 384, 1328);
    this.add.existing(tree_6);

    // tree_7
    const tree_7 = new Tree6(this, 320, 1392);
    this.add.existing(tree_7);

    // tree_8
    const tree_8 = new Tree7(this, 512, 1328);
    this.add.existing(tree_8);

    // tree_9
    const tree_9 = new Tree5(this, 384, 1376);
    this.add.existing(tree_9);

    // tree_10
    const tree_10 = new Tree7(this, 192, 1456);
    this.add.existing(tree_10);

    // tree_13
    const tree_13 = new Tree7(this, 128, 1520);
    this.add.existing(tree_13);

    // tree5
    const tree5 = new Tree5(this, -800, 464);
    this.add.existing(tree5);

    // skaduweeOwl
    const skaduweeOwl = new SkaduweeOwl(this, 976, 1040);
    this.add.existing(skaduweeOwl);

    // tree10
    const tree10 = new Tree10(this, 640, 576);
    this.add.existing(tree10);

    // tree9
    const tree9 = new Tree9(this, 352, 512);
    this.add.existing(tree9);

    // tree_14
    const tree_14 = new Tree11(this, -384, 672);
    this.add.existing(tree_14);

    // sheep
    const sheep = new Sheep(this, -152, 1248);
    this.add.existing(sheep);

    // fenceTop
    const fenceTop = new FenceTop(this, -192, 1184);
    this.add.existing(fenceTop);

    // fenceTopRight
    const fenceTopRight = new FenceTopRight(this, -160, 1200);
    this.add.existing(fenceTopRight);

    // sheep_1
    const sheep_1 = new Sheep(this, -192, 1232);
    this.add.existing(sheep_1);

    // fenceTopRight_1
    const fenceTopRight_1 = new FenceTopRight(this, -128, 1216);
    this.add.existing(fenceTopRight_1);

    // fenceTopRight_2
    const fenceTopRight_2 = new FenceTopRight(this, -96, 1232);
    this.add.existing(fenceTopRight_2);

    // fenceTopLeft
    const fenceTopLeft = new FenceTopLeft(this, -224, 1200);
    this.add.existing(fenceTopLeft);

    // fenceTopLeft_1
    const fenceTopLeft_1 = new FenceTopLeft(this, -256, 1216);
    this.add.existing(fenceTopLeft_1);

    // fenceBottomLeft
    const fenceBottomLeft = new FenceBottomLeft(this, -256, 1280);
    this.add.existing(fenceBottomLeft);

    // fenceBottomLeft_1
    const fenceBottomLeft_1 = new FenceBottomLeft(this, -224, 1296);
    this.add.existing(fenceBottomLeft_1);

    // fenceBottomLeft_2
    const fenceBottomLeft_2 = new FenceBottomLeft(this, -192, 1312);
    this.add.existing(fenceBottomLeft_2);

    // fenceBottomRight
    const fenceBottomRight = new FenceBottomRight(this, -96, 1296);
    this.add.existing(fenceBottomRight);

    // fenceBottomRight_1
    const fenceBottomRight_1 = new FenceBottomRight(this, -128, 1312);
    this.add.existing(fenceBottomRight_1);

    // fenceBottom
    const fenceBottom = new FenceBottom(this, -160, 1328);
    this.add.existing(fenceBottom);

    // stonePile
    const stonePile = new StonePile(this, -608, 768);
    this.add.existing(stonePile);

    // stonePile_1
    const stonePile_1 = new StonePile(this, -640, 784);
    this.add.existing(stonePile_1);

    // stonePile_2
    const stonePile_2 = new StonePile(this, -576, 784);
    this.add.existing(stonePile_2);

    // stonePile_3
    const stonePile_3 = new StonePile(this, -608, 800);
    this.add.existing(stonePile_3);

    // stonePile_4
    const stonePile_4 = new StonePile(this, -672, 768);
    this.add.existing(stonePile_4);

    // stonePile_5
    const stonePile_5 = new StonePile(this, -672, 800);
    this.add.existing(stonePile_5);

    // minerals
    const minerals = new Minerals(this, -224, 224);
    this.add.existing(minerals);

    // minerals_1
    const minerals_1 = new Minerals(this, -192, 208);
    this.add.existing(minerals_1);

    // minerals_2
    const minerals_2 = new Minerals(this, -192, 240);
    this.add.existing(minerals_2);

    // minerals_3
    const minerals_3 = new Minerals(this, -160, 224);
    this.add.existing(minerals_3);

    // minerals_4
    const minerals_4 = new Minerals(this, -256, 240);
    this.add.existing(minerals_4);

    // minerals_5
    const minerals_5 = new Minerals(this, -224, 256);
    this.add.existing(minerals_5);

    // tallGrass_5
    const tallGrass_5 = new TallGrass3(this, -400, 800);
    this.add.existing(tallGrass_5);

    // tallGrass7
    const tallGrass7 = new TallGrass7(this, -352, 816);
    this.add.existing(tallGrass7);

    // tallGrass
    const tallGrass = new TallGrass7(this, -320, 832);
    this.add.existing(tallGrass);

    // tallGrass_1
    const tallGrass_1 = new TallGrass7(this, -224, 848);
    this.add.existing(tallGrass_1);

    // tallGrass1
    const tallGrass1 = new TallGrass1(this, -288, 784);
    this.add.existing(tallGrass1);

    // tallGrass_2
    const tallGrass_2 = new TallGrass1(this, -320, 768);
    this.add.existing(tallGrass_2);

    // tallGrass_3
    const tallGrass_3 = new TallGrass1(this, -176, 816);
    this.add.existing(tallGrass_3);

    // tallGrass2
    const tallGrass2 = new TallGrass2(this, -240, 800);
    this.add.existing(tallGrass2);

    // tallGrass_4
    const tallGrass_4 = new TallGrass1(this, -208, 800);
    this.add.existing(tallGrass_4);

    // tallGrass6
    const tallGrass6 = new TallGrass6(this, -288, 848);
    this.add.existing(tallGrass6);

    // tallGrass4
    const tallGrass4 = new TallGrass4(this, -256, 864);
    this.add.existing(tallGrass4);

    // tallGrass3
    const tallGrass3 = new TallGrass3(this, -352, 752);
    this.add.existing(tallGrass3);

    // tallGrass_8
    const tallGrass_8 = new TallGrass1(this, 32, 896);
    this.add.existing(tallGrass_8);

    // tallGrass0
    const tallGrass0 = new TallGrass0(this, 64, 912);
    this.add.existing(tallGrass0);

    // tallGrass5
    const tallGrass5 = new TallGrass5(this, -32, 928);
    this.add.existing(tallGrass5);

    // tallGrass_6
    const tallGrass_6 = new TallGrass3(this, 0, 880);
    this.add.existing(tallGrass_6);

    // reeds1
    const reeds1 = new Reeds1(this, -352, 800);
    this.add.existing(reeds1);

    // reeds
    const reeds = new Reeds1(this, -288, 832);
    this.add.existing(reeds);

    // reeds_1
    const reeds_1 = new Reeds1(this, -256, 784);
    this.add.existing(reeds_1);

    // reeds_2
    const reeds_2 = new Reeds1(this, -160, 800);
    this.add.existing(reeds_2);

    // reeds_3
    const reeds_3 = new Reeds1(this, 64, 896);
    this.add.existing(reeds_3);

    // reeds_4
    const reeds_4 = new Reeds1(this, -224, 832);
    this.add.existing(reeds_4);

    // tivaraWorkerFemale
    const tivaraWorkerFemale = new TivaraWorkerFemale(this, -224, 704);
    this.add.existing(tivaraWorkerFemale);

    // tivaraWorkerMale
    const tivaraWorkerMale = new TivaraWorkerMale(this, -352, 464);
    this.add.existing(tivaraWorkerMale);

    // workMill_1
    const workMill_1 = new WorkMill(this, 608, 1184);
    this.add.existing(workMill_1);

    // wall
    const wall = new Wall(this, 512, 768);
    this.add.existing(wall);

    // stairs
    const stairs = new Stairs(this, 480, 784);
    this.add.existing(stairs);

    // stairs_1
    const stairs_1 = new Stairs(this, 544, 752);
    this.add.existing(stairs_1);

    // stairs_2
    const stairs_2 = new Stairs(this, -480, 272);
    this.add.existing(stairs_2);

    // seagulls
    const seagulls = new SoundEffectMarker(this, 928, 448);
    this.add.existing(seagulls);

    // water flowing
    const water_flowing = new SoundEffectMarker(this, 704, 896);
    this.add.existing(water_flowing);

    // water flowing_1
    const water_flowing_1 = new SoundEffectMarker(this, -32, 896);
    this.add.existing(water_flowing_1);

    // water flowing_2
    const water_flowing_2 = new SoundEffectMarker(this, -704, 672);
    this.add.existing(water_flowing_2);

    // birds
    const birds = new SoundEffectMarker(this, 192, 1376);
    this.add.existing(birds);

    // birds_1
    const birds_1 = new SoundEffectMarker(this, -640, 368);
    this.add.existing(birds_1);

    // skaduweeRangedFemale_1
    const skaduweeRangedFemale_1 = new SkaduweeRangedFemale(this, -116, 698);
    this.add.existing(skaduweeRangedFemale_1);

    // skaduweeMagicianFemale
    const skaduweeMagicianFemale = new SkaduweeMagicianFemale(this, -256, 608);
    this.add.existing(skaduweeMagicianFemale);

    // skaduweeWarriorMale_1
    const skaduweeWarriorMale_1 = new SkaduweeWarriorMale(this, -582, 597);
    this.add.existing(skaduweeWarriorMale_1);

    // skaduweeWorkerFemale_1
    const skaduweeWorkerFemale_1 = new SkaduweeWorkerFemale(this, -480, 608);
    this.add.existing(skaduweeWorkerFemale_1);

    // skaduweeWorkerMale_1
    const skaduweeWorkerMale_1 = new SkaduweeWorkerMale(this, -728, 557);
    this.add.existing(skaduweeWorkerMale_1);

    // skaduweeOwl_1
    const skaduweeOwl_1 = new SkaduweeOwl(this, -832, 528);
    this.add.existing(skaduweeOwl_1);

    // fenceRight_2
    const fenceRight_2 = new FenceRightCorner(this, -48, 1264);
    this.add.existing(fenceRight_2);

    // fenceLeft_1
    const fenceLeft_1 = new FenceLeftCorner(this, -296, 1248);
    this.add.existing(fenceLeft_1);

    // foliage_trees_resources_tree8_snow_png
    this.add.image(1120, 968, "outside", "foliage/trees/resources/tree8_snow.png");

    // foliage_trees_large_no_leaves_snow_png
    this.add.image(1296, 904, "outside", "foliage/trees/large/no_leaves_snow.png");

    // foliage_tree_trunks_tree_trunk_snow_png_1
    this.add.image(1072, 992, "outside", "foliage/tree_trunks/tree_trunk_snow.png");

    // foliage_tree_trunks_tree_fallen_snow_png
    this.add.image(1208, 936, "outside", "foliage/tree_trunks/tree_fallen_snow.png");

    // nature_rock_piles_6_snow_png
    this.add.image(1088, 1040, "outside", "nature/rock_piles/6_snow.png");

    // nature_rock_piles_1_snow_covered_png
    this.add.image(1176, 992, "outside", "nature/rock_piles/1_snow_covered.png");

    // nature_rock_piles_1_snow_png
    this.add.image(1128, 1016, "outside", "nature/rock_piles/1_snow.png");

    // nature_rock_piles_2_snow_png
    this.add.image(1064, 1024, "outside", "nature/rock_piles/2_snow.png");

    // nature_rock_piles_3_snow_covered_png
    this.add.image(1144, 976, "outside", "nature/rock_piles/3_snow_covered.png");

    // nature_rock_piles_5_snow_covered_png
    this.add.image(1208, 976, "outside", "nature/rock_piles/5_snow_covered.png");

    // nature_rock_piles_6_snow_covered_png
    this.add.image(1184, 960, "outside", "nature/rock_piles/6_snow_covered.png");

    // nature_rock_piles_1_snow_covered_png_1
    this.add.image(1096, 968, "outside", "nature/rock_piles/1_snow_covered.png");

    // foliage_trees_resources_tree7_snow_png_1
    this.add.image(1256, 928, "outside", "foliage/trees/resources/tree7_snow.png");

    // foliage_river_water_lily_png
    const foliage_river_water_lily_png = this.add.image(96, 960, "outside", "foliage/river/water lily.png");
    foliage_river_water_lily_png.scaleX = 0.5;
    foliage_river_water_lily_png.scaleY = 0.5;

    // foliage_river_water_lily_png_1
    const foliage_river_water_lily_png_1 = this.add.image(32, 928, "outside", "foliage/river/water lily.png");
    foliage_river_water_lily_png_1.scaleX = 0.5;
    foliage_river_water_lily_png_1.scaleY = 0.5;
    foliage_river_water_lily_png_1.flipX = true;

    // toxicFrog
    const toxicFrog = new ToxicFrog(this, 32, 928);
    this.add.existing(toxicFrog);

    // toxicFrog_1
    const toxicFrog_1 = new ToxicFrog(this, 96, 960);
    this.add.existing(toxicFrog_1);
    toxicFrog_1.flipX = true;
    toxicFrog_1.flipY = false;

    // toxicFrog_2
    const toxicFrog_2 = new ToxicFrog(this, -184, 848);
    this.add.existing(toxicFrog_2);

    // toxicFrog_3
    const toxicFrog_3 = new ToxicFrog(this, -224, 808);
    this.add.existing(toxicFrog_3);
    toxicFrog_3.flipX = true;
    toxicFrog_3.flipY = false;

    // treeBird
    const treeBird = new TreeBird(this, -424, 640);
    this.add.existing(treeBird);

    // treeBird_1
    const treeBird_1 = new TreeBird(this, 264, 440);
    this.add.existing(treeBird_1);

    // wolf
    const wolf = new Wolf(this, -320, 1216);
    this.add.existing(wolf);

    // stag
    const stag = new Stag(this, 80, 1400);
    this.add.existing(stag);

    // boar
    const boar = new Boar(this, 224, 1264);
    this.add.existing(boar);

    // badger
    const badger = new Badger(this, 24, 1072);
    this.add.existing(badger);

    // tree_12
    const tree_12 = new Tree7(this, 1024, 720);
    this.add.existing(tree_12);

    // tree_15
    const tree_15 = new Tree7(this, 1088, 688);
    this.add.existing(tree_15);

    // tree_16
    const tree_16 = new Tree1(this, 1184, 672);
    this.add.existing(tree_16);

    // tree_17
    const tree_17 = new Tree4(this, 960, 720);
    this.add.existing(tree_17);

    // spawn (components)
    const spawnEditorOwner = new EditorOwner(spawn);
    spawnEditorOwner.owner_id = "1";

    // spawn_1 (components)
    const spawn_1EditorOwner = new EditorOwner(spawn_1);
    spawn_1EditorOwner.owner_id = "2";

    // owlery (components)
    const owleryEditorOwner = new EditorOwner(owlery);
    owleryEditorOwner.owner_id = "2";

    // infantryInn (components)
    const infantryInnEditorOwner = new EditorOwner(infantryInn);
    infantryInnEditorOwner.owner_id = "2";

    // ankGuard (components)
    const ankGuardEditorOwner = new EditorOwner(ankGuard);
    ankGuardEditorOwner.owner_id = "1";

    // temple (components)
    const templeEditorOwner = new EditorOwner(temple);
    templeEditorOwner.owner_id = "1";

    // skaduweeWorkerMale (components)
    const skaduweeWorkerMaleEditorOwner = new EditorOwner(skaduweeWorkerMale);
    skaduweeWorkerMaleEditorOwner.owner_id = "2";

    // skaduweeWorkerFemale (components)
    const skaduweeWorkerFemaleEditorOwner = new EditorOwner(skaduweeWorkerFemale);
    skaduweeWorkerFemaleEditorOwner.owner_id = "2";

    // skaduweeRangedFemale (components)
    const skaduweeRangedFemaleEditorOwner = new EditorOwner(skaduweeRangedFemale);
    skaduweeRangedFemaleEditorOwner.owner_id = "2";

    // skaduweeWarriorMale (components)
    const skaduweeWarriorMaleEditorOwner = new EditorOwner(skaduweeWarriorMale);
    skaduweeWarriorMaleEditorOwner.owner_id = "2";

    // tivaraSlingshotFemale (components)
    const tivaraSlingshotFemaleEditorOwner = new EditorOwner(tivaraSlingshotFemale);
    tivaraSlingshotFemaleEditorOwner.owner_id = "1";

    // olival (components)
    const olivalEditorOwner = new EditorOwner(olival);
    olivalEditorOwner.owner_id = "1";

    // watchTower (components)
    const watchTowerEditorOwner = new EditorOwner(watchTower);
    watchTowerEditorOwner.owner_id = "1";

    // blockStone_5 (prefab fields)
    blockStone_5.z = 32;

    // blockStone_6 (prefab fields)
    blockStone_6.z = 32;

    // blockStone_8 (prefab fields)
    blockStone_8.z = 32;

    // blockStone_9 (prefab fields)
    blockStone_9.z = 64;

    // blockStone_10 (prefab fields)
    blockStone_10.z = 92;

    // blockStone_11 (prefab fields)
    blockStone_11.z = 128;

    // workMill (components)
    const workMillEditorOwner = new EditorOwner(workMill);
    workMillEditorOwner.owner_id = "1";

    // blockStoneWater1 (prefab fields)
    blockStoneWater1.z = 16;

    // blockStoneWater4 (prefab fields)
    blockStoneWater4.z = 32;

    // skaduweeOwl (components)
    const skaduweeOwlEditorOwner = new EditorOwner(skaduweeOwl);
    skaduweeOwlEditorOwner.owner_id = "2";

    // tivaraWorkerFemale (components)
    const tivaraWorkerFemaleEditorOwner = new EditorOwner(tivaraWorkerFemale);
    tivaraWorkerFemaleEditorOwner.owner_id = "1";

    // tivaraWorkerMale (components)
    const tivaraWorkerMaleEditorOwner = new EditorOwner(tivaraWorkerMale);
    tivaraWorkerMaleEditorOwner.owner_id = "1";

    // workMill_1 (components)
    const workMill_1EditorOwner = new EditorOwner(workMill_1);
    workMill_1EditorOwner.owner_id = "2";

    // seagulls (prefab fields)
    seagulls.sfxType = "seagulls";

    // water_flowing (prefab fields)
    water_flowing.sfxType = "water_flowing";

    // water_flowing_1 (prefab fields)
    water_flowing_1.sfxType = "water_flowing";

    // water_flowing_2 (prefab fields)
    water_flowing_2.sfxType = "water_flowing";

    // birds (prefab fields)
    birds.sfxType = "birds";

    // birds_1 (prefab fields)
    birds_1.sfxType = "birds";

    // skaduweeRangedFemale_1 (components)
    const skaduweeRangedFemale_1EditorOwner = new EditorOwner(skaduweeRangedFemale_1);
    skaduweeRangedFemale_1EditorOwner.owner_id = "1";

    // skaduweeMagicianFemale (components)
    const skaduweeMagicianFemaleEditorOwner = new EditorOwner(skaduweeMagicianFemale);
    skaduweeMagicianFemaleEditorOwner.owner_id = "1";

    // skaduweeWarriorMale_1 (components)
    const skaduweeWarriorMale_1EditorOwner = new EditorOwner(skaduweeWarriorMale_1);
    skaduweeWarriorMale_1EditorOwner.owner_id = "1";

    // skaduweeWorkerFemale_1 (components)
    const skaduweeWorkerFemale_1EditorOwner = new EditorOwner(skaduweeWorkerFemale_1);
    skaduweeWorkerFemale_1EditorOwner.owner_id = "1";

    // skaduweeWorkerMale_1 (components)
    const skaduweeWorkerMale_1EditorOwner = new EditorOwner(skaduweeWorkerMale_1);
    skaduweeWorkerMale_1EditorOwner.owner_id = "1";

    // skaduweeOwl_1 (components)
    const skaduweeOwl_1EditorOwner = new EditorOwner(skaduweeOwl_1);
    skaduweeOwl_1EditorOwner.owner_id = "1";

    // treeBird (prefab fields)
    treeBird.z = 64;

    // treeBird_1 (prefab fields)
    treeBird_1.z = 64;

    this.tilemap = tilemap;

    this.events.emit("scene-awake");
  }

  public tilemap!: Phaser.Tilemaps.Tilemap;

  /* START-USER-CODE */

  // Write your code here

  createGradientSky() {
    // Create a graphics object
    const graphics = this.add.graphics();
    const width = this.scale.width;
    const height = this.scale.height;

    // Define gradient colors
    const topColor = 0x87ceeb;
    const bottomColor = 0x12110f;

    // Draw gradient
    graphics.fillGradientStyle(topColor, topColor, bottomColor, bottomColor);
    graphics.fillRect(0, 0, width, height);

    graphics.setScrollFactor(0);
    graphics.displayOriginX = 0.5;
    graphics.displayOriginY = 0.5;
  }

  create() {
    // todo - buggy when zooming out - this.createGradientSky();

    this.editorCreate();

    super.create();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
