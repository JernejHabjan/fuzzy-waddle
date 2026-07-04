// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class StoneGolem extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 96, y ?? 111, texture || "mobs_golems", frame ?? "Golem2/Idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(64, 60, 24.744779552091174), Phaser.Geom.Circle.Contains);
    this.scaleX = 2.5;
    this.scaleY = 2.5;
    this.setOrigin(0.5, 0.5796935427053551);
    this.play("Golem2/Idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.StoneGolem;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
