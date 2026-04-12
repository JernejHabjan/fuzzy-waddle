
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyDragonBonesBody extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 19.648519265765756, texture || "environment_1", frame ?? "rocky/Dragon_bones_body_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Rectangle(1, 49, 128, 29.640838164237394), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.5, 0.528504056763795);

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
