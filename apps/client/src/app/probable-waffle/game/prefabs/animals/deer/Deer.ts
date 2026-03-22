// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export default class Deer extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 25, texture || "hunt_animals", frame ?? "Deer/Idle/front/Deer_Idle_front1.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 14, 12.754838061189425), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.773612963520417);
    this.play("Deer/Idle/front/Deer_Idle_front");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Deer;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
