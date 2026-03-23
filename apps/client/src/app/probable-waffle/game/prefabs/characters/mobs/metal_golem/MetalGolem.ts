// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class MetalGolem extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 96, y ?? 111, texture || "mobs_golems", frame ?? "Golem3/Idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(63, 57, 28.668747139280235), Phaser.Geom.Circle.Contains);
    this.scaleX = 2.5;
    this.scaleY = 2.5;
    this.setOrigin(0.4986229817008978, 0.5773878558983586);
    this.play("Golem3/Idle/s");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.MetalGolem;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
