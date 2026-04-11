
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsCucumbers extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.475384202298084, y ?? 44.8523052137885, texture || "crops", frame ?? "crops/cucumbers/4.png");

    this.setInteractive(new Phaser.Geom.Rectangle(3, 0, 25.374089232178203, 38.29440201395316), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.48360575632181513, 0.6917093558108981);

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
