// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import Sandhold from "../prefabs/Sandhold";
import Owlery from "../prefabs/Owlery";
import Bridge from "../prefabs/Bridge";
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

		// tiles_1
		const tiles_1 = this.add.tilemap("tiles");
		tiles_1.addTilesetImage("tiles", "tiles_1");

		// tileMap_level
		tiles_1.createLayer("TileMap_level_1", ["tiles"], 608, -272);

		// sandhold
		const sandhold = new Sandhold(this, 864, 368);
		this.add.existing(sandhold);

		// owlery
		const owlery = new Owlery(this, 703, 286);
		this.add.existing(owlery);

		// bridge
		const bridge = new Bridge(this, 544, 592);
		this.add.existing(bridge);

		// idle_downwarrior_idle
		const idle_downwarrior_idle = this.add.sprite(824, 359, "warrior_idle", 4);
		idle_downwarrior_idle.play("idle_downwarrior_idle");

		this.tiles = tiles;
		this.tiles_1 = tiles_1;

		this.events.emit("scene-awake");
	}

	private tiles!: Phaser.Tilemaps.Tilemap;
	private tiles_1!: Phaser.Tilemaps.Tilemap;

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
  }

  update(time: number, delta: number): void {
    this.controls.update(delta);

    const cam = this.cameras.main;
    const pointer = this.input.activePointer;

    if (pointer.x < this.edgeThickness) {
      cam.scrollX -= this.moveSpeed;
    } else if (pointer.x > cam.width - this.edgeThickness) {
      cam.scrollX += this.moveSpeed;
    }

    if (pointer.y < this.edgeThickness) {
      cam.scrollY -= this.moveSpeed;
    } else if (pointer.y > cam.height - this.edgeThickness) {
      cam.scrollY += this.moveSpeed;
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
