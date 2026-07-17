
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidMagicCircle extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32.24627538638609, y ?? 14.260272065106243, texture || "environment_1", frame ?? "humid/magic_circle_dark_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(64, 64, 37.49132618740715), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5019240264561413, 0.4864083755086425);

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
