import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
/* END-USER-IMPORTS */

export default class Cannon extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 64, texture || "siege_weapons_cannon", frame ?? "move/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(64, 64, 28), Phaser.Geom.Circle.Contains);

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Cannon;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
