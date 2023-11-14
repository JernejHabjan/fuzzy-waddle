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
/* START-USER-IMPORTS */
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
		tiles.createLayer("TileMap_level_1", ["tiles"], 0, 0);

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
		const temple = new Temple(this, -176, 448);
		this.add.existing(temple);

		// workMill
		const workMill = new WorkMill(this, -608, 866);
		this.add.existing(workMill);

		// architecture_blocks_doors_left_png
		const architecture_blocks_doors_left_png = this.add.image(-416, 256, "outside", "architecture/blocks/doors_left.png");
		architecture_blocks_doors_left_png.setOrigin(0.5, 0.75);

		// architecture_blocks_doors_right_png
		const architecture_blocks_doors_right_png = this.add.image(-384, 240, "outside", "architecture/blocks/doors_right.png");
		architecture_blocks_doors_right_png.setOrigin(0.5, 0.75);

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
		const skaduweeMagicianFemale = new SkaduweeMagicianFemale(this, 1312, 896);
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

		// lists
		const tileMapLayer2 = [architecture_blocks_doors_right_png, architecture_blocks_doors_left_png];

		this.tiles = tiles;
		this.tileMapLayer2 = tileMapLayer2;

		this.events.emit("scene-awake");
	}

	private tiles!: Phaser.Tilemaps.Tilemap;
	private tileMapLayer2!: Phaser.GameObjects.Image[];

	/* START-USER-CODE */
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private controlConfig!: Phaser.Types.Cameras.Controls.FixedKeyControlConfig;
  private controls!: Phaser.Cameras.Controls.FixedKeyControl;

  edgeThickness = 20; // Change this value to adjust the 'sensitivity' of your screen edge.
  moveSpeed = 10; // Change this value to adjust the speed of your camera movement.
  // Write your code here

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
  }

  handleZSort = () => {
    this.children.each((child: any) => {
      child.depth = child.y;
    });
  };
  handleCameraCenter = () => {
    // set camera to the center of isometric tilemap
    const mapLeft = 0 + 32 - this.tiles.widthInPixels / 2;
    const mapRight = 0 + 32 + this.tiles.widthInPixels / 2;
    const mapTop = 0;
    const mapBottom = this.tiles.heightInPixels;

    this.cameras.main.setBounds(mapLeft, mapTop, mapRight - mapLeft, mapBottom - mapTop, true);
  };

  update(time: number, delta: number): void {
    this.controls.update(delta);

    const cam = this.cameras.main;
    const pointer = this.input.activePointer;

    // if (pointer.x < this.edgeThickness) {
    //   cam.scrollX -= this.moveSpeed;
    // } else if (pointer.x > cam.width - this.edgeThickness) {
    //   cam.scrollX += this.moveSpeed;
    // }
    //
    // if (pointer.y < this.edgeThickness) {
    //   cam.scrollY -= this.moveSpeed;
    // } else if (pointer.y > cam.height - this.edgeThickness) {
    //   cam.scrollY += this.moveSpeed;
    // }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
