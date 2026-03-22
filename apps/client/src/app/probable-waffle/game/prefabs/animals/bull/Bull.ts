// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Bull extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 48, y ?? 60, texture || "farm_animals", frame ?? "Bull/Idle/front/Bull_front_Idle1.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 29, 15.043701719257019), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.6282748966394707);
    this.play("Bull/Idle/front/Bull_front_Idle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.Bull;

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
