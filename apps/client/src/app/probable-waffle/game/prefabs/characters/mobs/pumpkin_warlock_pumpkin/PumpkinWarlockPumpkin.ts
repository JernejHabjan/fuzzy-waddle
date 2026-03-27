// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class PumpkinWarlockPumpkin extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 22, texture || "mobs_pumpkin_warlock", frame ?? "Pumpkin/pumpkin - jump/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 10.185081989969195), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6846058682524427);
    this.play("mobs_pumpkin_warlock_pumpkin_idle_sPumpkin/pumpkin - jump/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.PumpkinWarlockPumpkin;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
