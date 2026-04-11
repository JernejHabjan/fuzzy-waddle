
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsPineapple extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32.58894577258347, y ?? 50.083961964526125, texture || "crops", frame ?? "crops/pineapple/16.png");

    this.setInteractive(new Phaser.Geom.Circle(17, 20, 8.460999368206362), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5184045553932335, 0.8151238113914414);

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
