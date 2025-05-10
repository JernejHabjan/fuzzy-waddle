// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../data/object-names";
/* END-USER-IMPORTS */

export default class Stag extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 40.204036014919424, texture || "animals_2", frame ?? "stag/idle/se/00.png");

    this.setInteractive(new Phaser.Geom.Ellipse(16, 20.5, 32, 41), Phaser.Geom.Ellipse.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.8122607482100719);
    this.play("stag/idle/se");

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Stag;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
