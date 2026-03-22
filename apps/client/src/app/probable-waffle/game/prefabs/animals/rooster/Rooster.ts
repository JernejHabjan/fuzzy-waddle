// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export default class Rooster extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 16,
      y ?? 25,
      texture || "farm_animals",
      frame ?? "Rooster/Rooster_Idle/front/Rooster__front_Idle1.png"
    );

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 9.82708336702106), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.773612963520417);
    this.play("Rooster/Rooster_Idle/front/Rooster__front_Idle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Rooster;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
