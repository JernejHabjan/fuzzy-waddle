// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class UndeadLandRuin1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 42.7129238818339, texture || "environment_1", frame ?? "undead_land/Ruin_shadow1_1.png");

    this.setInteractive(
      new Phaser.Geom.Rectangle(24, 19, 75.83288905757516, 92.23228125819757),
      Phaser.Geom.Rectangle.Contains
    );
    this.setOrigin(0.5, 0.7086947178268274);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, [
      "undead_land/Ruin_shadow1_1.png",
      "undead_land/Ruin_shadow1_2.png",
      "undead_land/Ruin_shadow1_3.png",
      "undead_land/Ruin_shadow1_4.png",
      "undead_land/Ruin_shadow1_5.png"
    ]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
