// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class BigWaterSlime extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 48, y ?? 59, texture || "mobs_slimes", frame ?? "Slime2/Idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 12.796311752818095), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.6094587105913063);
    this.play("mobs_Slime2/Idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.BigWaterSlime;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
