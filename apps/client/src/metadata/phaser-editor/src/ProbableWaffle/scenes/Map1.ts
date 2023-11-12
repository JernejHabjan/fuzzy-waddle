// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import Sandhold from "../prefabs/Sandhold";
import Owlery from "../prefabs/Owlery";
import Bridge from "../prefabs/Bridge";
import InfantryInn from "../prefabs/InfantryInn";
import AnkGuard from "../prefabs/AnkGuard";
import Temple from "../prefabs/Temple";
import WorkMill from "../prefabs/WorkMill";
import SkaduweeWorkerMale from "../prefabs/characters/skaduwee/SkaduweeWorkerMale";
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
		const owlery = new Owlery(this, 288, 640);
		this.add.existing(owlery);

		// bridge
		const bridge = new Bridge(this, 32, 912);
		this.add.existing(bridge);

		// general_warrior_idle_left
		const general_warrior_idle_left = this.add.sprite(448, 896, "warrior_idle", 2);
		general_warrior_idle_left.setOrigin(0.5, 0.9);
		general_warrior_idle_left.play("general_warrior_idle_left");

		// skaduwee_magician_female_idle_left
		const skaduwee_magician_female_idle_left = this.add.sprite(512, 880, "magician_female_idle", 2);
		skaduwee_magician_female_idle_left.setOrigin(0.5, 0.9);
		skaduwee_magician_female_idle_left.play("skaduwee_magician_female_idle_left");

		// skaduwee_warrior_male_idle_left
		const skaduwee_warrior_male_idle_left = this.add.sprite(416, 944, "warrior_male_idle", 2);
		skaduwee_warrior_male_idle_left.setOrigin(0.5, 0.9);
		skaduwee_warrior_male_idle_left.play("skaduwee_warrior_male_idle_left");

		// skaduwee_ranged_female_idle_right
		const skaduwee_ranged_female_idle_right = this.add.sprite(96, 784, "ranged_female_idle", 6);
		skaduwee_ranged_female_idle_right.setOrigin(0.5, 0.9);
		skaduwee_ranged_female_idle_right.play("skaduwee_ranged_female_idle_right");

		// tivara_maceman_male_idle_down
		const tivara_maceman_male_idle_down = this.add.sprite(320, 896, "maceman_male_idle", 4);
		tivara_maceman_male_idle_down.setOrigin(0.5, 0.9);
		tivara_maceman_male_idle_down.play("tivara_maceman_male_idle_down");

		// tivara_slingshot_female_idle_down
		const tivara_slingshot_female_idle_down = this.add.sprite(480, 832, "slingshot_female_idle", 4);
		tivara_slingshot_female_idle_down.setOrigin(0.5, 0.9);
		tivara_slingshot_female_idle_down.play("tivara_slingshot_female_idle_down");

		// tivara_worker_female_idle_right
		const tivara_worker_female_idle_right = this.add.sprite(0, 784, "worker_female_idle_1", 6);
		tivara_worker_female_idle_right.play("tivara_worker_female_idle_right");

		// skaduwee_worker_female_idle_left
		const skaduwee_worker_female_idle_left = this.add.sprite(352, 768, "worker_female_idle", 2);
		skaduwee_worker_female_idle_left.setOrigin(0.5, 0.9);
		skaduwee_worker_female_idle_left.play("skaduwee_worker_female_idle_left");

		// skaduwee_worker_male_idle_down
		const skaduwee_worker_male_idle_down = this.add.sprite(384, 816, "worker_male_idle", 4);
		skaduwee_worker_male_idle_down.setOrigin(0.5, 0.9);
		skaduwee_worker_male_idle_down.play("skaduwee_worker_male_idle_down");

		// tivara_worker_male_idle_down
		const tivara_worker_male_idle_down = this.add.sprite(96, 768, "worker_male_idle_1", 4);
		tivara_worker_male_idle_down.setOrigin(0.5, 0.9);
		tivara_worker_male_idle_down.play("tivara_worker_male_idle_down");

		// infantryInn
		const infantryInn = new InfantryInn(this, 480, 608);
		this.add.existing(infantryInn);

		// ankGuard
		const ankGuard = new AnkGuard(this, 704, 592);
		this.add.existing(ankGuard);

		// temple
		const temple = new Temple(this, -192, 400);
		this.add.existing(temple);

		// workMill
		const workMill = new WorkMill(this, -608, 866);
		this.add.existing(workMill);

		// architecture_blocks_doors_left_png
		const architecture_blocks_doors_left_png = this.add.image(288, 800, "outside", "architecture/blocks/doors_left.png");
		architecture_blocks_doors_left_png.setOrigin(0.5, 0.75);

		// architecture_blocks_doors_right_png
		const architecture_blocks_doors_right_png = this.add.image(256, 784, "outside", "architecture/blocks/doors_right.png");
		architecture_blocks_doors_right_png.setOrigin(0.5, 0.75);

		// skaduweeWorkerMale
		const skaduweeWorkerMale = new SkaduweeWorkerMale(this, 145, 776);
		this.add.existing(skaduweeWorkerMale);

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
