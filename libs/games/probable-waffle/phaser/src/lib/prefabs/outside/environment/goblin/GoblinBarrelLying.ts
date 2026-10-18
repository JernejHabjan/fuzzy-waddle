import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
/* END-USER-IMPORTS */

export default class GoblinBarrelLying extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "goblin/barrel_lying.png");

    this.setInteractive(new Phaser.Geom.Ellipse(15, 19, 28.22878470582396, 19.85683565864637), Phaser.Geom.Ellipse.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.GoblinBarrelLying;

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
