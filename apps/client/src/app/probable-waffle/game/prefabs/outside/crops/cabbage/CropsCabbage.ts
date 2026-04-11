
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsCabbage extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.68692833330426, y ?? 43.93006833295536, texture || "crops", frame ?? "crops/cabbage/4.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 10.28109453790222), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.4902165104157581, 0.6228146354048549);

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
