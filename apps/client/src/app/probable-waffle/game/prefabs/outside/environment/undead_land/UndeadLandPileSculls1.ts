
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class UndeadLandPileSculls1 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 26.887603032201255, texture || "environment_1", frame ?? "undead_land/Pile_sculls_shadow1.png");

    this.setInteractive(new Phaser.Geom.Circle(64, 64, 24.78101603876938), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.5850593986890723);

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
