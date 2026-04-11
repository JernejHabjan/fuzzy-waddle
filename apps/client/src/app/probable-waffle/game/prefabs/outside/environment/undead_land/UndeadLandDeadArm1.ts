// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class UndeadLandDeadArm1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 45.60302064031087,
      y ?? 48.48582216572539,
      texture || "environment_1",
      frame ?? "undead_land/Dead_arm_shadow1_1.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "1.4845399507259174 12.756769922952692 10.553220621740493 2.0686819892569375 32 0 45.93515411873253 9.27643549210066 60.50981948286311 49.11385415405757 47.71650210768182 57.534771919999685 32.57715939420447 53.56583294251831 27.556996879892836 31.379953443786214"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.7125471975048574, 0.7575909713394592);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, [
      "undead_land/Dead_arm_shadow1_1.png",
      "undead_land/Dead_arm_shadow1_2.png",
      "undead_land/Dead_arm_shadow1_3.png",
      "undead_land/Dead_arm_shadow1_4.png"
    ]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
