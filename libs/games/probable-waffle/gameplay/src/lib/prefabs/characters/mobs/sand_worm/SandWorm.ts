// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class SandWorm extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 60, y ?? 90.94116220089873, texture || "mobs_sand_work", frame ?? "idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Ellipse(40, 40, 33.08900932188992, 58.980091581563954), Phaser.Geom.Ellipse.Contains);
    this.scaleX = 2;
    this.scaleY = 2;
    this.setOrigin(0.5, 0.7564559818612397);
    this.play("mobs_sand_worm_idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.SandWorm;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
