// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class CursedLandBones1 extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "cursed_land/Bones_shadow1_2.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 20.639940746088005), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  // TODO: Wire up remaining animation frames / asset variants:
  //   - cursed_land/Bones_shadow1_3.png
  //   - cursed_land/Bones_shadow1_4.png
  //   - cursed_land/Bones_shadow1_5.png
  //   - cursed_land/Bones_shadow1_6.png
  //   - cursed_land/Bones_shadow1_7.png
  //   - cursed_land/Bones_shadow1_8.png
  //   - cursed_land/Bones_shadow1_9.png
  //   - cursed_land/Bones_shadow1_10.png
  //   - cursed_land/Bones_shadow1_11.png

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
