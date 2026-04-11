
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class UndeadLandRock1 extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 42.92871395554814, texture || "environment_1", frame ?? "undead_land/Rock_shadow1_1.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 24.839773649818646), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6707611555554397);

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
