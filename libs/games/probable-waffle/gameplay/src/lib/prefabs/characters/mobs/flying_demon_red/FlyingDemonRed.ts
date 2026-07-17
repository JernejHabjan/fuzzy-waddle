// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class FlyingDemonRed extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 60, y ?? 93, texture || "mobs_flying_demon_red", frame ?? "fly/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(40, 40, 27.94329828095796), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.773612963520417);
    this.play("mobs_flying_demon_red_fly/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.FlyingDemonRed;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
