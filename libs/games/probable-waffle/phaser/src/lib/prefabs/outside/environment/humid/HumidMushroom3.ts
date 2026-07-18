
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidMushroom3 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "humid/mushroom3_dark_shadow1.png");

    this.setInteractive(new Phaser.Geom.Rectangle(40, 19, 47.54647353320442, 87.54469714639498), Phaser.Geom.Rectangle.Contains);
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
