// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class UndeadLandRock1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 42.92871395554814,
      texture || "environment_1",
      frame ?? "undead_land/Rock_shadow1_1.png"
    );

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 24.839773649818646), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6707611555554397);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, [
      "undead_land/Rock_shadow1_1.png",
      "undead_land/Rock_shadow1_2.png",
      "undead_land/Rock_shadow1_3.png",
      "undead_land/Rock_shadow1_4.png",
      "undead_land/Rock_shadow1_5.png"
    ]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
