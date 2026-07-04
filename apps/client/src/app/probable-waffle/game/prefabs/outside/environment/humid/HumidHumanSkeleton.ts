
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidHumanSkeleton extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 42.30915087003564, texture || "environment_1", frame ?? "humid/Human_skeleton_dark_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 11.637644141447517), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.5721609646886137);

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
