
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidDemonScull extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 31.838264062840977, texture || "environment_1", frame ?? "humid/Demon_scull_dark_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(64, 75, 20.973153052992984), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6237364379909451);

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
