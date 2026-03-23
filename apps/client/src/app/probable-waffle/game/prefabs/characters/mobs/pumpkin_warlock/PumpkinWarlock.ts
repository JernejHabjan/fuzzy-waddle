// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class PumpkinWarlock extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 50, y ?? 71, texture || "mobs_pumpkin_warlock", frame ?? "Warlock/idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Ellipse(23, 16, 46, 32), Phaser.Geom.Ellipse.Contains);
    this.setOrigin(0.5, 0.7141412333833488);
    this.play("mobs_pumpkin_warlock_Warlock/idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.PumpkinWarlock;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
