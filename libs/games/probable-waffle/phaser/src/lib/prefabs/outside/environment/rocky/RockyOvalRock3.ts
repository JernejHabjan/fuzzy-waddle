
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyOvalRock3 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 34.274162159661515, y ?? 32.333549566776256, texture || "environment_1", frame ?? "rocky/Oval_rock3_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Ellipse(33, 34, 47.05859385716721, 26.814846793549265), Phaser.Geom.Ellipse.Contains);
    this.setOrigin(0.5355337837447112, 0.505211711980879);

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
