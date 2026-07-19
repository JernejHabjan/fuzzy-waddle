
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidBonefire extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 32.11982126986276, texture || "environment_1", frame ?? "humid/Bonefire_dark_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 15.15866985351806), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.5018722073416056);

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
