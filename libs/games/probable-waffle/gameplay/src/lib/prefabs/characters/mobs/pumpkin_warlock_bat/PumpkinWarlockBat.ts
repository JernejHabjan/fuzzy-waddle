// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class PumpkinWarlockBat extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 18, texture || "mobs_pumpkin_warlock", frame ?? "Bat/bat - fly/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 9.863770960545555), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.5592685540485187);
    this.play("mobs_pumpkin_warlock_Bat/bat - fly/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.PumpkinWarlockBat;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
