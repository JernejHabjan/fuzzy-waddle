
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsPeppers extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.621740899838485, y ?? 50.710856884490866, texture || "crops", frame ?? "crops/peppers/0.png");

    this.setInteractive(new Phaser.Geom.Rectangle(7, 1, 18.446827399365826, 29.717491181808942), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.48817940311995267, 0.8347142776403396);

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
