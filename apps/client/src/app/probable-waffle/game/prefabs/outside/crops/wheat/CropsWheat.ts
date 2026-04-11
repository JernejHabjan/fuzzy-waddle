
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsWheat extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 29.997023551109486, y ?? 49.50223233666789, texture || "crops", frame ?? "crops/wheat/20.png");

    this.setInteractive(new Phaser.Geom.Circle(15, 19, 8.367578603626844), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.4374069859721714, 0.7969447605208715);

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
