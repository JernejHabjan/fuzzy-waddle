// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export default class Piglet extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 16,
      y ?? 25,
      texture || "farm_animals",
      frame ?? "Piglet/Piglet_Idle/front/Piglet_front_Idle1.png"
    );

    this.setInteractive(new Phaser.Geom.Circle(16, 18, 10.32461314871189), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.773612963520417);
    this.play("Piglet/Piglet_Idle/front/Piglet_front_Idle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Piglet;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
