// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import Sandhold from "../prefabs/buildings/tivara/Sandhold";
import Owlery from "../prefabs/buildings/skaduwee/Owlery";
import Bridge from "../prefabs/buildings/general/Bridge";
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
import StairsRight from "../prefabs/buildings/tivara/wall/StairsRight";
import BushDownwardsSmall from "../prefabs/outside/foliage/bushes/BushDownwardsSmall";
import BushDownwardsLarge from "../prefabs/outside/foliage/bushes/BushDownwardsLarge";
import WallBottomLeft from "../prefabs/buildings/tivara/wall/WallBottomLeft";
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

    // bridge
    const bridge = new Bridge(this, 32, 912);
    this.add.existing(bridge);

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
    const skaduweeMagicianFemale = new SkaduweeMagicianFemale(this, 1312, 848);
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

    // blood_splatter_small_1
    const blood_splatter_small_1 = this.add.sprite(272, 720, "effects_1", "blood-splatter-small/1/1_0.png");
    blood_splatter_small_1.scaleX = 0.5;
    blood_splatter_small_1.scaleY = 0.5;
    blood_splatter_small_1.play("blood_splatter_small_1");

    // wallTopLeftTopRight
    const wallTopLeftTopRight = new WallTopLeftTopRight(this, -560, 368);
    this.add.existing(wallTopLeftTopRight);

    // wallTopRight
    const wallTopRight = new WallTopRight(this, -528, 384);
    this.add.existing(wallTopRight);

    // watchTower
    const watchTower = new WatchTower(this, -480, 400);
    this.add.existing(watchTower);

    // stairsRight_1
    const stairsRight_1 = new StairsRight(this, -224, 688);
    this.add.existing(stairsRight_1);

    // bushDownwardsSmall
    const bushDownwardsSmall = new BushDownwardsSmall(this, -354, 400);
    this.add.existing(bushDownwardsSmall);

    // bushDownwardsLarge
    const bushDownwardsLarge = new BushDownwardsLarge(this, -256, 352);
    this.add.existing(bushDownwardsLarge);

    // wallBottomLeft
    const wallBottomLeft = new WallBottomLeft(this, -112, 736);
    this.add.existing(wallBottomLeft);

    // infantryInn (prefab fields)
    infantryInn.z = 32;

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
        child.depth = child.y + z;
      }
    });
  };
  handleCameraCenter = () => {
    // set camera to the center of isometric tilemap

    const maxMapLayers = 1;
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
