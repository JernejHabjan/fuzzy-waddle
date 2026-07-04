
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyOvalRock4 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 34.06134477938029, texture || "environment_1", frame ?? "rocky/Oval_rock4_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 14.315674599654116), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.5322085121778171);

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
