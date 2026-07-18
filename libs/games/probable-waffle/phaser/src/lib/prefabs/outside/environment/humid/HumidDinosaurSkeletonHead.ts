
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidDinosaurSkeletonHead extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 33.16456987052969, texture || "environment_1", frame ?? "humid/Dinosaur_skeleton__head_dark_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 18.1815465448436), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.5181964042270264);

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
