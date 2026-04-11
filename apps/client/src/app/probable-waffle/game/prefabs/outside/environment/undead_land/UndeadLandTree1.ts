
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class UndeadLandTree1 extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 29.916454722960523, y ?? 39.66581889184208, texture || "environment_1", frame ?? "undead_land/Tree_shadow1_1.png");

    this.setInteractive(new Phaser.Geom.Ellipse(63, 62, 49.24098458713784, 66.09355007837084), Phaser.Geom.Ellipse.Contains);
    this.setOrigin(0.4837223025231291, 0.6848892100925162);

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
