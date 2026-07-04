// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class VikingBoat extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 64, texture || "units", frame ?? "common/viking-ship/ship9.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 22.807436734177145), Phaser.Geom.Circle.Contains);
    this.scaleX = 2;
    this.scaleY = 2;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.VikingBoat;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
