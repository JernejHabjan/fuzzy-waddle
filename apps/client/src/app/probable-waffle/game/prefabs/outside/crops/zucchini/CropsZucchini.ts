
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsZucchini extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32.192928314208984, y ?? 40.75645580539479, texture || "crops", frame ?? "crops/zucchini/12.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 11.131814446083911), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5060289692054787, 0.5236392296187007);

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
