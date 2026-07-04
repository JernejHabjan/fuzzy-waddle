// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class CursedLandRockEyes1 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "cursed_land/Rock_eyes_shadow1_1.png");

    this.setInteractive(new Phaser.Geom.Circle(64, 64, 29.87409874405462), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, ["cursed_land/Rock_eyes_shadow1_1.png", "cursed_land/Rock_eyes_shadow1_2.png", "cursed_land/Rock_eyes_shadow1_3.png", "cursed_land/Rock_eyes_shadow1_4.png", "cursed_land/Rock_eyes_shadow1_5.png"]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
