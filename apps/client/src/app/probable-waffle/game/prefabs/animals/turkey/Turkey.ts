// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export default class Turkey extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 16,
      y ?? 25,
      texture || "farm_animals",
      frame ?? "Turkey/Turkey_Idle/front/Turkey_Idle_Front1.png"
    );

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 10.325289790596205), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.773612963520417);
    this.play("Turkey/Turkey_Idle/front/Turkey_Idle_Front");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Turkey;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
