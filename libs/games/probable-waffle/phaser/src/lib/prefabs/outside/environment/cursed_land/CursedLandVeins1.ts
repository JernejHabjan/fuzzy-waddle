import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class CursedLandVeins1 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "cursed_land/Veins_shadow1_1.png");

    this.setInteractive(new Phaser.Geom.Polygon("63 162 140 60 217 22 156 191 39 227"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    new RandomSpriteComponent(this, ["cursed_land/Veins_shadow1_1.png", "cursed_land/Veins_shadow1_2.png", "cursed_land/Veins_shadow1_3.png", "cursed_land/Veins_shadow1_4.png"]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.CursedLandVeins1;

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
