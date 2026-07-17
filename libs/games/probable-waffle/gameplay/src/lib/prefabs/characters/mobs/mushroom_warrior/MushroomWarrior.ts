// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class MushroomWarrior extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 49, texture || "mobs_mushroom_warrior", frame ?? "idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 21.040848113656644), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.773612963520417);
    this.play("mobs_mushroom_warrior_idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.MushroomWarrior;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
