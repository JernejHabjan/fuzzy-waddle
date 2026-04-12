
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyBlackMushrooms1 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 29.283653638266, y ?? 54.68639104426831, texture || "environment_1", frame ?? "rocky/Black_mushrooms1_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 24.91976519490765), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.45755708809790624, 0.8544748600666924);

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
