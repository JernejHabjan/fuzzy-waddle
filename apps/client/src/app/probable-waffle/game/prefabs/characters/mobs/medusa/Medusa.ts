// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Medusa extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 48, y ?? 66.0750611159855, texture || "mobs_medusa", frame ?? "idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 29, 19.08396424027322), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.6910615168119327);
    this.play("mobs_medusa_idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Medusa;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
