// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

export default class Corpy extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 48,
      y ?? 53.26887806294279,
      texture || "animals",
      frame ?? "corpy/idle/Corpio_idle_bottom_left1.png"
    );

    this.setInteractive(new Phaser.Geom.Circle(48, 48, 34.67401439603983), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.5548841464889874);
    this.play("corpy/idle/Corpio_idle_bottom_left");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Corpy;
  // Write your code here
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
