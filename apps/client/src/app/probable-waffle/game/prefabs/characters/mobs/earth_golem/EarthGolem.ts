// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class EarthGolem extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 96, y ?? 111, texture || "mobs_golems", frame ?? "Golem1/Idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(63, 62, 24.71519993855504), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.5788316470952387);
    this.play("Golem1/Idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.EarthGolem;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
