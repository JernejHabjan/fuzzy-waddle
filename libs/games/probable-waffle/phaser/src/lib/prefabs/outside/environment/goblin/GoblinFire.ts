// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
/* END-USER-IMPORTS */

export default class GoblinFire extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 52.184439038662816, texture || "environment_1", frame ?? "goblin/fire.png");

    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, 33, 64), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.5, 0.8153818599791065);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.GoblinFire;
// todo note that this one also has GoblinFireLit sprite
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
