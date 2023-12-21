// You can write more code here

/* START OF COMPILED CODE */

import Tree7 from "../prefabs/outside/foliage/trees/resources/Tree7";
import Sandhold from "../prefabs/buildings/tivara/Sandhold";
import Owlery from "../prefabs/buildings/skaduwee/Owlery";
import InfantryInn from "../prefabs/buildings/skaduwee/InfantryInn";
import AnkGuard from "../prefabs/buildings/tivara/AnkGuard";
import Temple from "../prefabs/buildings/tivara/Temple";
import SkaduweeWorkerMale from "../prefabs/characters/skaduwee/SkaduweeWorkerMale";
import SkaduweeWorkerFemale from "../prefabs/characters/skaduwee/SkaduweeWorkerFemale";
import SkaduweeRangedFemale from "../prefabs/characters/skaduwee/SkaduweeRangedFemale";
import SkaduweeMagicianFemale from "../prefabs/characters/skaduwee/SkaduweeMagicianFemale";
import SkaduweeWarriorMale from "../prefabs/characters/skaduwee/SkaduweeWarriorMale";
import GeneralWarrior from "../prefabs/characters/general/GeneralWarrior";
import TivaraSlingshotFemale from "../prefabs/characters/tivara/TivaraSlingshotFemale";
import TivaraWorkerFemale from "../prefabs/characters/tivara/TivaraWorkerFemale";
import TivaraWorkerMale from "../prefabs/characters/tivara/TivaraWorkerMale";
import TivaraMacemanMale from "../prefabs/characters/tivara/TivaraMacemanMale";
import Olival from "../prefabs/buildings/tivara/Olival";
import WallTopLeftTopRight from "../prefabs/buildings/tivara/wall/WallTopLeftTopRight";
import WallTopRight from "../prefabs/buildings/tivara/wall/WallTopRight";
import WatchTower from "../prefabs/buildings/tivara/wall/WatchTower";
import BushDownwardsSmall from "../prefabs/outside/foliage/bushes/BushDownwardsSmall";
import BushDownwardsLarge from "../prefabs/outside/foliage/bushes/BushDownwardsLarge";
import BridgeStone from "../prefabs/outside/architecture/river/BridgeStone";
import Tree5 from "../prefabs/outside/foliage/trees/resources/Tree5";
import BlockStone2 from "../prefabs/outside/nature/block_stone/BlockStone2";
import BlockStone1 from "../prefabs/outside/nature/block_stone/BlockStone1";
import BlockStoneTopRight from "../prefabs/outside/nature/block_stone_grass/BlockStoneTopRight";
import BlockStoneTopRightBottomRight from "../prefabs/outside/nature/block_stone_grass/BlockStoneTopRightBottomRight";
import TreeTrunk from "../prefabs/outside/foliage/tree_trunks/TreeTrunk";
import RampStoneTopRight from "../prefabs/outside/nature/ramp/stone/RampStoneTopRight";
import RampStoneTopLeft from "../prefabs/outside/nature/ramp/stone/RampStoneTopLeft";
import RockPiles5 from "../prefabs/outside/nature/rock_piles/RockPiles5";
import RockPiles6 from "../prefabs/outside/nature/rock_piles/RockPiles6";
import RockPiles2 from "../prefabs/outside/nature/rock_piles/RockPiles2";
import RockPiles3 from "../prefabs/outside/nature/rock_piles/RockPiles3";
import Tree4 from "../prefabs/outside/foliage/trees/resources/Tree4";
import Tree6 from "../prefabs/outside/foliage/trees/resources/Tree6";
import Tree1 from "../prefabs/outside/foliage/trees/resources/Tree1";
import BushDry from "../prefabs/outside/foliage/bushes/BushDry";
import BushUpwardsSmall from "../prefabs/outside/foliage/bushes/BushUpwardsSmall";
import WorkMill from "../prefabs/buildings/tivara/WorkMill";
import BlockStoneWater1 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater1";
import BlockStoneWater4 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater4";
import BlockStoneWater3 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater3";
/* START-USER-IMPORTS */
import { ScaleHandler } from "../world/map/scale.handler";
import { InputHandler } from "../world/managers/controllers/input/input.handler";
import { LightsHandler } from "../world/map/vision/lights.handler";
import { DepthHelper } from "../world/map/depth.helper";
import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";
import {
  ProbableWaffleGameMode,
  ProbableWaffleGameModeData,
  ProbableWaffleGameState,
  ProbableWaffleGameStateData,
  ProbableWaffleLevels,
  ProbableWafflePlayer,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData,
  ProbableWaffleSpectator,
  ProbableWaffleSpectatorData
} from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleGameData } from "./probable-waffle-game-data";
import { CursorHandler } from "../world/managers/controllers/input/cursor.handler";
import { AnimatedTilemap } from "../world/map/animated-tile.helper";
/* END-USER-IMPORTS */

export default class MapRiverCrossing extends BaseScene<
  ProbableWaffleGameData,
  ProbableWaffleGameStateData,
  ProbableWaffleGameState,
  ProbableWaffleGameModeData,
  ProbableWaffleGameMode,
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayer,
  ProbableWaffleSpectatorData,
  ProbableWaffleSpectator
> {
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

    // tilemap_level_1
    tilemap.createLayer("TileMap_level_1", ["tiles"], -32, 0);

    // tree_12
    const tree_12 = new Tree7(this, -16, 1376);
    this.add.existing(tree_12);

    // tree_11
    const tree_11 = new Tree7(this, 160, 1328);
    this.add.existing(tree_11);

    // sandhold
    const sandhold = new Sandhold(this, 32, 592);
    this.add.existing(sandhold);

    // owlery
    const owlery = new Owlery(this, 1184, 880);
    this.add.existing(owlery);

    // infantryInn
    const infantryInn = new InfantryInn(this, 1360, 800);
    this.add.existing(infantryInn);

    // ankGuard
    const ankGuard = new AnkGuard(this, 480, 608);
    this.add.existing(ankGuard);

    // temple
    const temple = new Temple(this, -176, 464);
    this.add.existing(temple);

    // skaduweeWorkerMale
    const skaduweeWorkerMale = new SkaduweeWorkerMale(this, 1472, 800);
    this.add.existing(skaduweeWorkerMale);

    // skaduweeWorkerFemale
    const skaduweeWorkerFemale = new SkaduweeWorkerFemale(this, 1136, 960);
    this.add.existing(skaduweeWorkerFemale);

    // skaduweeRangedFemale
    const skaduweeRangedFemale = new SkaduweeRangedFemale(this, 1264, 720);
    this.add.existing(skaduweeRangedFemale);

    // skaduweeMagicianFemale
    const skaduweeMagicianFemale = new SkaduweeMagicianFemale(this, 1360, 848);
    this.add.existing(skaduweeMagicianFemale);

    // skaduweeWarriorMale
    const skaduweeWarriorMale = new SkaduweeWarriorMale(this, 1216, 784);
    this.add.existing(skaduweeWarriorMale);

    // generalWarrior
    const generalWarrior = new GeneralWarrior(this, 144, 1360);
    this.add.existing(generalWarrior);

    // tivaraSlingshotFemale
    const tivaraSlingshotFemale = new TivaraSlingshotFemale(this, 160, 704);
    this.add.existing(tivaraSlingshotFemale);

    // tivaraWorkerFemale
    const tivaraWorkerFemale = new TivaraWorkerFemale(this, 288, 640);
    this.add.existing(tivaraWorkerFemale);

    // tivaraWorkerMale
    const tivaraWorkerMale = new TivaraWorkerMale(this, 320, 736);
    this.add.existing(tivaraWorkerMale);

    // tivaraMacemanMale
    const tivaraMacemanMale = new TivaraMacemanMale(this, 544, 704);
    this.add.existing(tivaraMacemanMale);

    // olival
    const olival = new Olival(this, 160, 784);
    this.add.existing(olival);

    // wallTopLeftTopRight
    const wallTopLeftTopRight = new WallTopLeftTopRight(this, -560, 368);
    this.add.existing(wallTopLeftTopRight);

    // wallTopRight
    const wallTopRight = new WallTopRight(this, -528, 384);
    this.add.existing(wallTopRight);

    // watchTower
    const watchTower = new WatchTower(this, -480, 400);
    this.add.existing(watchTower);

    // bushDownwardsSmall
    const bushDownwardsSmall = new BushDownwardsSmall(this, -832, 464);
    this.add.existing(bushDownwardsSmall);

    // bushDownwardsLarge
    const bushDownwardsLarge = new BushDownwardsLarge(this, -576, 400);
    this.add.existing(bushDownwardsLarge);

    // bridgeStone
    const bridgeStone = new BridgeStone(this, -64, 896);
    this.add.existing(bridgeStone);

    // tree5
    const tree5 = new Tree5(this, -448, 288);
    this.add.existing(tree5);

    // blockStone2
    const blockStone2 = new BlockStone2(this, 0, 16);
    this.add.existing(blockStone2);

    // blockStone
    const blockStone = new BlockStone2(this, -32, 32);
    this.add.existing(blockStone);

    // blockStone1
    const blockStone1 = new BlockStone1(this, 32, 32);
    this.add.existing(blockStone1);

    // blockStone_1
    const blockStone_1 = new BlockStone1(this, -64, 48);
    this.add.existing(blockStone_1);

    // blockStone_2
    const blockStone_2 = new BlockStone2(this, 0, 48);
    this.add.existing(blockStone_2);

    // blockStone_3
    const blockStone_3 = new BlockStone2(this, -32, 64);
    this.add.existing(blockStone_3);

    // blockStoneTopRight
    const blockStoneTopRight = new BlockStoneTopRight(this, -96, 64);
    this.add.existing(blockStoneTopRight);

    // blockStoneTopRightBottomRight
    const blockStoneTopRightBottomRight = new BlockStoneTopRightBottomRight(this, -64, 80);
    this.add.existing(blockStoneTopRightBottomRight);

    // blockStone_4
    const blockStone_4 = new BlockStone1(this, -32, 96);
    this.add.existing(blockStone_4);

    // treeTrunk
    const treeTrunk = new TreeTrunk(this, -405, 277);
    this.add.existing(treeTrunk);

    // rampStoneTopRight
    const rampStoneTopRight = new RampStoneTopRight(this, -64, 112);
    this.add.existing(rampStoneTopRight);

    // rampStoneTopLeft
    const rampStoneTopLeft = new RampStoneTopLeft(this, 0, 112);
    this.add.existing(rampStoneTopLeft);

    // blockStone_5
    const blockStone_5 = new BlockStone2(this, 0, -16);
    this.add.existing(blockStone_5);

    // blockStone_6
    const blockStone_6 = new BlockStone2(this, 32, 0);
    this.add.existing(blockStone_6);

    // rampStoneTopRight_1
    const rampStoneTopRight_1 = new RampStoneTopRight(this, 0, 16);
    this.add.existing(rampStoneTopRight_1);

    // rockPiles5
    const rockPiles5 = new RockPiles5(this, -48, 160);
    this.add.existing(rockPiles5);

    // blockStone_7
    const blockStone_7 = new BlockStone2(this, 0, 176);
    this.add.existing(blockStone_7);

    // rockPiles6
    const rockPiles6 = new RockPiles6(this, 48, 160);
    this.add.existing(rockPiles6);

    // blockStone_8
    const blockStone_8 = new BlockStone2(this, 0, 144);
    this.add.existing(blockStone_8);

    // blockStone_9
    const blockStone_9 = new BlockStone2(this, 0, 112);
    this.add.existing(blockStone_9);

    // blockStone_10
    const blockStone_10 = new BlockStone2(this, 0, 80);
    this.add.existing(blockStone_10);

    // blockStone_11
    const blockStone_11 = new BlockStone2(this, 0, 48);
    this.add.existing(blockStone_11);

    // rockPiles2
    const rockPiles2 = new RockPiles2(this, 32, 192);
    this.add.existing(rockPiles2);

    // rockPiles3
    const rockPiles3 = new RockPiles3(this, -32, 192);
    this.add.existing(rockPiles3);

    // rockPiles
    const rockPiles = new RockPiles2(this, 0, 208);
    this.add.existing(rockPiles);

    // tree4
    const tree4 = new Tree4(this, 0, 16);
    this.add.existing(tree4);

    // tree7
    const tree7 = new Tree7(this, -720, 400);
    this.add.existing(tree7);

    // tree6
    const tree6 = new Tree6(this, -656, 400);
    this.add.existing(tree6);

    // tree_1
    const tree_1 = new Tree7(this, -624, 448);
    this.add.existing(tree_1);

    // tree_2
    const tree_2 = new Tree4(this, -912, 848);
    this.add.existing(tree_2);

    // tree1
    const tree1 = new Tree1(this, -1184, 832);
    this.add.existing(tree1);

    // tree_3
    const tree_3 = new Tree4(this, -896, 1040);
    this.add.existing(tree_3);

    // treeTrunk_1
    const treeTrunk_1 = new TreeTrunk(this, -784, 880);
    this.add.existing(treeTrunk_1);

    // tree_4
    const tree_4 = new Tree5(this, 432, 1312);
    this.add.existing(tree_4);

    // tree_5
    const tree_5 = new Tree6(this, 29, 1424);
    this.add.existing(tree_5);

    // bushDry
    const bushDry = new BushDry(this, 761, 1046);
    this.add.existing(bushDry);

    // bushDry_1
    const bushDry_1 = new BushDry(this, -1072, 944);
    this.add.existing(bushDry_1);

    // bushDry_2
    const bushDry_2 = new BushDry(this, 416, 784);
    this.add.existing(bushDry_2);

    // bushDry_3
    const bushDry_3 = new BushDry(this, -60, 301);
    this.add.existing(bushDry_3);

    // bushUpwardsSmall
    const bushUpwardsSmall = new BushUpwardsSmall(this, -128, 80);
    this.add.existing(bushUpwardsSmall);

    // bushDownwardsSmall_1
    const bushDownwardsSmall_1 = new BushDownwardsSmall(this, 224, 1312);
    this.add.existing(bushDownwardsSmall_1);

    // bushUpwardsSmall_1
    const bushUpwardsSmall_1 = new BushUpwardsSmall(this, 52, 1440);
    this.add.existing(bushUpwardsSmall_1);

    // bushDry_4
    const bushDry_4 = new BushDry(this, -1024, 768);
    this.add.existing(bushDry_4);

    // tree
    const tree = new Tree5(this, -704, 512);
    this.add.existing(tree);

    // workMill
    const workMill = new WorkMill(this, -592, 512);
    this.add.existing(workMill);

    // blockStone_12
    const blockStone_12 = new BlockStone1(this, 352, 976);
    this.add.existing(blockStone_12);

    // blockStoneWater1
    const blockStoneWater1 = new BlockStoneWater1(this, 384, 944);
    this.add.existing(blockStoneWater1);

    // blockStoneWater4
    const blockStoneWater4 = new BlockStoneWater4(this, 352, 944);
    this.add.existing(blockStoneWater4);

    // blockStoneWater3
    const blockStoneWater3 = new BlockStoneWater3(this, 416, 976);
    this.add.existing(blockStoneWater3);

    // blockStoneWater
    const blockStoneWater = new BlockStoneWater4(this, 384, 992);
    this.add.existing(blockStoneWater);

    // rockPiles_1
    const rockPiles_1 = new RockPiles5(this, 320, 992);
    this.add.existing(rockPiles_1);

    // tree_6
    const tree_6 = new Tree7(this, 368, 1328);
    this.add.existing(tree_6);

    // tree_7
    const tree_7 = new Tree6(this, 304, 1376);
    this.add.existing(tree_7);

    // tree_8
    const tree_8 = new Tree7(this, 512, 1312);
    this.add.existing(tree_8);

    // tree_9
    const tree_9 = new Tree5(this, 416, 1376);
    this.add.existing(tree_9);

    // tree_10
    const tree_10 = new Tree7(this, 192, 1440);
    this.add.existing(tree_10);

    // tree_13
    const tree_13 = new Tree7(this, 112, 1520);
    this.add.existing(tree_13);

    // infantryInn (prefab fields)
    infantryInn.z = 0;

    // blockStone_5 (prefab fields)
    blockStone_5.z = 32;

    // blockStone_6 (prefab fields)
    blockStone_6.z = 32;

    // rampStoneTopRight_1 (prefab fields)
    rampStoneTopRight_1.z = 32;

    // blockStone_8 (prefab fields)
    blockStone_8.z = 32;

    // blockStone_9 (prefab fields)
    blockStone_9.z = 64;

    // blockStone_10 (prefab fields)
    blockStone_10.z = 92;

    // blockStone_11 (prefab fields)
    blockStone_11.z = 128;

    // tree4 (prefab fields)
    tree4.z = 160;

    // blockStoneWater1 (prefab fields)
    blockStoneWater1.z = 16;

    // blockStoneWater4 (prefab fields)
    blockStoneWater4.z = 32;

    this.tilemap = tilemap;

    this.events.emit("scene-awake");
  }

  private tilemap!: Phaser.Tilemaps.Tilemap;

  /* START-USER-CODE */
  create() {
    this.editorCreate();

    new ScaleHandler(this, this.tilemap, { margins: { left: 150, bottom: 100 }, maxLayers: 8 });
    new InputHandler(this);
    new CursorHandler(this);
    new LightsHandler(this, { enableLights: false });
    new DepthHelper(this);
    new AnimatedTilemap(this, this.tilemap, this.tilemap.tilesets);

    console.log("playing level", ProbableWaffleLevels[this.baseGameData.gameInstance.data.gameModeData!.level!].name);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here