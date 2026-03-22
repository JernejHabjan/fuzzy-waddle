// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

import { ObjectNames } from "@fuzzy-waddle/api-interfaces";

export default class Calf extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 40.614631512706566,
      texture || "farm_animals",
      frame ?? "Calf/Calf_Idle/front/Calf_front_Idle1.png"
    );

    this.setInteractive(new Phaser.Geom.Circle(32, 33, 11.675469169716088), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6269665809064571);
    this.play("Calf/Calf_Idle/front/Calf_front_Idle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Calf;

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
