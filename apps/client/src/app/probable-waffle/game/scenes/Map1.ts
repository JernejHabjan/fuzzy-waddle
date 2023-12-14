// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import Sandhold from "../prefabs/buildings/tivara/Sandhold";
import Owlery from "../prefabs/buildings/skaduwee/Owlery";
import InfantryInn from "../prefabs/buildings/skaduwee/InfantryInn";
import AnkGuard from "../prefabs/buildings/tivara/AnkGuard";
import Temple from "../prefabs/buildings/tivara/Temple";
import WorkMill from "../prefabs/buildings/tivara/WorkMill";
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
import Tree7 from "../prefabs/outside/foliage/trees/resources/Tree7";
import Tree6 from "../prefabs/outside/foliage/trees/resources/Tree6";
import Tree1 from "../prefabs/outside/foliage/trees/resources/Tree1";
import BushDry from "../prefabs/outside/foliage/bushes/BushDry";
import BushUpwardsSmall from "../prefabs/outside/foliage/bushes/BushUpwardsSmall";
/* START-USER-IMPORTS */
import ActorContainer from "../entity/actor/ActorContainer";
/* END-USER-IMPORTS */

export default class Map1 extends Phaser.Scene {
  constructor() {
    super("Map1");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // tiles
    const tiles = this.add.tilemap("tiles");
    tiles.addTilesetImage("tiles", "tiles_1");

    // tilemap_level_1
    tiles.createLayer("TileMap_level_1", ["tiles"], -32, 0);

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

    // workMill
    const workMill = new WorkMill(this, -608, 866);
    this.add.existing(workMill);

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
    const tree_2 = new Tree4(this, -1024, 816);
    this.add.existing(tree_2);

    // tree1
    const tree1 = new Tree1(this, -1200, 864);
    this.add.existing(tree1);

    // tree_3
    const tree_3 = new Tree4(this, -752, 1072);
    this.add.existing(tree_3);

    // treeTrunk_1
    const treeTrunk_1 = new TreeTrunk(this, -934, 903);
    this.add.existing(treeTrunk_1);

    // tree_4
    const tree_4 = new Tree5(this, 308, 1322);
    this.add.existing(tree_4);

    // tree_5
    const tree_5 = new Tree6(this, 29, 1424);
    this.add.existing(tree_5);

    // bushDry
    const bushDry = new BushDry(this, 761, 1046);
    this.add.existing(bushDry);

    // bushDry_1
    const bushDry_1 = new BushDry(this, -628, 991);
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
    const bushDry_4 = new BushDry(this, -976, 784);
    this.add.existing(bushDry_4);

    // tree
    const tree = new Tree5(this, -704, 512);
    this.add.existing(tree);

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

    this.tiles = tiles;

    this.events.emit("scene-awake");
  }

  private tiles!: Phaser.Tilemaps.Tilemap;

  /* START-USER-CODE */
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private controlConfig!: Phaser.Types.Cameras.Controls.FixedKeyControlConfig;
  private controls!: Phaser.Cameras.Controls.FixedKeyControl;

  preload(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  create() {
    this.editorCreate();
    this.controlConfig = {
      camera: this.cameras.main,
      left: this.cursors.left,
      right: this.cursors.right,
      up: this.cursors.up,
      down: this.cursors.down,
      speed: 2
    };
    this.controls = new Phaser.Cameras.Controls.FixedKeyControl(this.controlConfig);
    this.handleCameraCenter();
    this.handleZSort();
    this.zoomWithScroll();
  }

  handleZSort = () => {
    this.children.each((child: any) => {
      child.depth = child.y;
      if (child instanceof ActorContainer) {
        const z = child.z;
        child.depth = child.y + z * 2;
      }
    });
  };
  handleCameraCenter = () => {
    // set camera to the center of isometric tilemap

    const maxMapLayers = 8;
    const mapLeft = -this.tiles.widthInPixels / 2;
    const mapRight = +this.tiles.widthInPixels / 2;
    const mapTop = -maxMapLayers * 32;
    const mapBottom = this.tiles.heightInPixels;

    this.cameras.main.setBounds(mapLeft, mapTop, mapRight - mapLeft, mapBottom - mapTop, true);
  };

  zoomWithScroll = () => {
    this.input.on("wheel", (pointer: any, gameObjects: any, deltaX: any, deltaY: any, deltaZ: any) => {
      if (deltaY > 0) {
        this.cameras.main.zoom -= 0.1;
      } else {
        this.cameras.main.zoom += 0.1;
      }
    });
  };

  update(time: number, delta: number): void {
    this.controls.update(delta);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
