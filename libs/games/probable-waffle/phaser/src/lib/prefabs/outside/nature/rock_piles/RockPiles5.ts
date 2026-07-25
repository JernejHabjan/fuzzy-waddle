import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
/* END-USER-IMPORTS */

export default class RockPiles5 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "nature/rock_piles/5.png");

    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.RockPiles5;

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
