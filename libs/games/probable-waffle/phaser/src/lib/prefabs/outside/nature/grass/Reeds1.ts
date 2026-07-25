import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
/* END-USER-IMPORTS */

export default class Reeds1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 32, texture || "outside", frame ?? "nature/grass/reeds_1.png");

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Reeds1;

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
