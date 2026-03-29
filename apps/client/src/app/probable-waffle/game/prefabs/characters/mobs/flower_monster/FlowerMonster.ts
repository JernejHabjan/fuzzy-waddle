// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class FlowerMonster extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 48, y ?? 74, texture || "mobs_flower_monster", frame ?? "idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 36, 25.024464239525226), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.773612963520417);
    this.play("mobs_flower_monster_idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.FlowerMonster;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
