
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FlyingDemonBlue extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 60, y ?? 93, texture || "mobs_flying_demon_blue", frame ?? "fly/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(40, 40, 26.89258162369986), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.773612963520417);
    this.play("mobs_flying_demon_blue_fly/w");

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
