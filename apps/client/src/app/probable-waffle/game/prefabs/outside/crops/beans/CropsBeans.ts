
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsBeans extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 30.520721081669922, y ?? 48.98618594555339, texture || "crops", frame ?? "crops/beans/8.png");

    this.setInteractive(new Phaser.Geom.Rectangle(6, 10, 18.153857824404177, 33.470321000656455), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.4537725338021851, 0.7682627026954331);

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
