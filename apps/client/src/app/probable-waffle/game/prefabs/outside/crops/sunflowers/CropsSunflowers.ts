
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsSunflowers extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32.43021011352539, y ?? 57.059486153612895, texture || "crops", frame ?? "crops/sunflowers/16.png");

    this.setInteractive(new Phaser.Geom.Rectangle(8, 7, 15.820104173832735, 42.83658177534231), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.513444065221452, 0.9177682357527348);

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
