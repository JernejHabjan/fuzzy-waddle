// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class UndeadLandGrave1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32.87904188561887,
      y ?? 42.54994030916302,
      texture || "environment_1",
      frame ?? "undead_land/Grave_shadow1_1.png"
    );

    this.setInteractive(
      new Phaser.Geom.Rectangle(11, 8, 10.279399828091847, 13.1261950942822),
      Phaser.Geom.Rectangle.Contains
    );
    this.setOrigin(0.5274700589255896, 0.5796856346613444);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, [
      "undead_land/Grave_shadow1_1.png",
      "undead_land/Grave_shadow1_2.png",
      "undead_land/Grave_shadow1_3.png",
      "undead_land/Grave_shadow1_4.png",
      "undead_land/Grave_shadow1_5.png",
      "undead_land/Grave_shadow1_6.png",
      "undead_land/Grave_shadow1_7.png",
      "undead_land/Grave_shadow1_8.png",
      "undead_land/Grave_shadow1_9.png",
      "undead_land/Grave_shadow1_10.png",
      "undead_land/Grave_shadow1_11.png",
      "undead_land/Grave_shadow1_12.png",
      "undead_land/Grave_shadow1_13.png",
      "undead_land/Grave_shadow1_14.png",
      "undead_land/Grave_shadow1_15.png",
      "undead_land/Grave_shadow1_16.png",
      "undead_land/Grave_shadow1_17.png"
    ]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
