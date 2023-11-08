// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Map1 extends Phaser.Scene {
  constructor() {
    super('Map1');

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // tiles
    const tiles = this.add.tilemap('tiles');
    tiles.addTilesetImage('tiles', 'tiles_1');

    // tileMap_level
    tiles.createLayer('TileMap_level_1', ['tiles'], 715, -205);

    this.tiles = tiles;

    this.events.emit('scene-awake');
  }

  private tiles!: Phaser.Tilemaps.Tilemap;

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
