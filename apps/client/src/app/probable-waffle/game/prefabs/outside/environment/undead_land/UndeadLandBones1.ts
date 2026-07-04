// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class UndeadLandBones1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "undead_land/Bones_shadow1_1.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "3.04250808059912 18.435516205761118 9.129952387221167 10.719037507226133 22.162227522524695 5.060286461633815 28.93558104679429 11.83363998590341 21.9907502181128 22.465232859440505 8.444043169573611 25.980517599884216"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, [
      "undead_land/Bones_shadow1_1.png",
      "undead_land/Bones_shadow1_2.png",
      "undead_land/Bones_shadow1_3.png",
      "undead_land/Bones_shadow1_4.png",
      "undead_land/Bones_shadow1_5.png",
      "undead_land/Bones_shadow1_6.png",
      "undead_land/Bones_shadow1_7.png",
      "undead_land/Bones_shadow1_8.png",
      "undead_land/Bones_shadow1_9.png",
      "undead_land/Bones_shadow1_10.png",
      "undead_land/Bones_shadow1_11.png",
      "undead_land/Bones_shadow1_12.png",
      "undead_land/Bones_shadow1_13.png",
      "undead_land/Bones_shadow1_14.png",
      "undead_land/Bones_shadow1_15.png",
      "undead_land/Bones_shadow1_16.png",
      "undead_land/Bones_shadow1_17.png",
      "undead_land/Bones_shadow1_18.png"
    ]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
