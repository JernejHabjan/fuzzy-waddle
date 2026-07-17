// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class ForestWendigo extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 75, y ?? 107.32729416367076, texture || "mobs_wendigo", frame ?? "wendigo - idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(50, 50, 27.39945381949527), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.7157949246115552);
    this.play("mobs_forest_wendigo_wendigo - idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.ForestWendigo;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
