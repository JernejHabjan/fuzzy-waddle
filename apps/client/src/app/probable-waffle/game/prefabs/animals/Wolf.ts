// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../data/object-names";
/* END-USER-IMPORTS */

export default class Wolf extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 44.63423422034173, texture || "animals_2", frame ?? "wolf/idle/se/04.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 17.728843673401734), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.631606606461893);
    this.play("wolf/idle/se");

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Wolf;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
