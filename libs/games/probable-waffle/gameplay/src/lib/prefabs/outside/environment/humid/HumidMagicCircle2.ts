
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidMagicCircle2 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 21.405121337350977, texture || "environment_1", frame ?? "humid/magic_circle2_dark_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(64, 64, 26.07942068710672), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.5422275104480545);

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
