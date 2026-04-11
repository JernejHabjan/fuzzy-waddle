
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsPumpkin extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32.075915342458664, y ?? 41.015788493803065, texture || "crops", frame ?? "crops/pumpkin/12.png");

    this.setInteractive(new Phaser.Geom.Rectangle(6, 4, 18.74268562137708, 39.66962822472475), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.5023723544518333, 0.620662749885242);

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
