
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class CropsLettuce extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 43.278409007575235, texture || "crops", frame ?? "crops/salad/8.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 18, 8.126838134094172), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6024502814867261);

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
