
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class GroundTurnip extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "crops", frame ?? "ground/turnip/6.png");

    this.setInteractive(new Phaser.Geom.Rectangle(3, 6, 9.886645320476688, 22.365825493673462), Phaser.Geom.Rectangle.Contains);
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
