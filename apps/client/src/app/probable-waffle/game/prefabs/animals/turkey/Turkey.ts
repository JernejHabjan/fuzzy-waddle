// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Turkey extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 24,
      y ?? 37,
      texture || "farm_animals",
      frame ?? "Turkey/Turkey_Idle/front/Turkey_Idle_Front1.png"
    );

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 10.325289790596205), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
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
