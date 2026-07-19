
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidCrystalBlueGreenVertical2 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 33.944269582099615, texture || "environment_1", frame ?? "humid/crystal_blue-green_vertical2.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 10.099458686485463), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.31075842444061297);

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
