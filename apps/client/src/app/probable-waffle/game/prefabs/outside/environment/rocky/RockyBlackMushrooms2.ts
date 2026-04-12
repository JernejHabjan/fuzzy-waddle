
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyBlackMushrooms2 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.28926732402254, y ?? 44.09097028212397, texture || "environment_1", frame ?? "rocky/Black_mushrooms2_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 15.560126215941885), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.4888948019378522, 0.688921410658187);

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
