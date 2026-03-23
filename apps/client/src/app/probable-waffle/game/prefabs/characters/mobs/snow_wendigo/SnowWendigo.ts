// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class SnowWendigo extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 75, y ?? 107.90850868905214, texture || "mobs_snow_wendigo", frame ?? "idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(50, 50, 27.75916886763959), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.7196696881140978);
    this.play("mobs_snow_wendigo_idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.SnowWendigo;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
