// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Rooster extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 24,
      y ?? 37,
      texture || "farm_animals",
      frame ?? "Rooster/Rooster_Idle/front/Rooster__front_Idle1.png"
    );

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 9.82708336702106), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.773612963520417);
    this.play("Rooster/Rooster_Idle/front/Rooster__front_Idle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Rooster;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
