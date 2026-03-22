// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Banshee extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 60, y ?? 93, texture || "mobs_banshee", frame ?? "idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(40, 43, 21.192170586571407), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.773612963520417);
    this.play("mobs_banshee_idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Banshee;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
