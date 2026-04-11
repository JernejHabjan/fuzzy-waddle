
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class GroundBoletus extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32.0797986253965, y ?? 48.87778487936151, texture || "crops", frame ?? "ground/boletus/3.png");

    this.setInteractive(new Phaser.Geom.Circle(8, 20, 8.158093792084095), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5049874140872812, 0.7774307774800473);

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
