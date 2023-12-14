// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RampStoneBottomRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-29.31265711709725 -9.907429499172714 19.406709800902014 -35.097556712456424 32 -32 31.94308756244577 1.2220034195229061 0.28628033313970036 16 -31.98714686381638 0.6221098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_ramp_stone_bottom_right
    const outside_nature_ramp_stone_bottom_right = scene.add.image(
      0,
      -17.87410141979456,
      "outside",
      "nature/ramp/stone/bottom_right.png"
    );
    outside_nature_ramp_stone_bottom_right.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_ramp_stone_bottom_right);

    // this (prefab fields)
    this.z = 0;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
