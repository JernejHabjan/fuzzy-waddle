// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Chick extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 12, y ?? 19, texture || "farm_animals", frame ?? "Chick/Idle/front/Chick_Idle_front1.png");

    this.setInteractive(new Phaser.Geom.Circle(8, 8, 4.394057879328587), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.773612963520417);
    this.play("Chick/Idle/front/Chick_Idle_front");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Chick;

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
