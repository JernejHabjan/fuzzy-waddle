
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class GroundCarrot extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.538915872648193, y ?? 49.936553334877594, texture || "crops", frame ?? "ground/carrot/0.png");

    this.setInteractive(new Phaser.Geom.Rectangle(2, 2, 10.70759916827163, 25.1165484518495), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.47118224204051207, 0.8105172917149248);

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
