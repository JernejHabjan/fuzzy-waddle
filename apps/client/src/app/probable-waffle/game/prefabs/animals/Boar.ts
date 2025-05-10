// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../data/object-names";
/* END-USER-IMPORTS */

export default class Boar extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 23, y ?? 29.133422248980015, texture || "animals_2", frame ?? "boar/idle/se/00.png");

    this.setInteractive(new Phaser.Geom.Ellipse(23, 16, 46, 32), Phaser.Geom.Ellipse.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.773612963520417);
    this.play("boar/idle/se");

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Boar;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
