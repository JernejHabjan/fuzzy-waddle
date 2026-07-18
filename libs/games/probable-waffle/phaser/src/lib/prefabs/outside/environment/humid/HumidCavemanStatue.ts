
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidCavemanStatue extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "humid/caveman_statue_dark_shadow1.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 29.0104051645266), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.75);

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
