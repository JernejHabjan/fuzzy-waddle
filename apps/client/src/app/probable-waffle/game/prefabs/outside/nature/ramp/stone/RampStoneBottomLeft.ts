// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RampStoneBottomLeft extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-32 -32 -18.751175440168986 -37.58466281259941 29.412655085929643 -7.274666016002861 29.82786052149946 1.6522508487481744 0.28628033313970036 16 -31.98714686381638 0.6221098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_ramp_stone_bottom_left
    const outside_nature_ramp_stone_bottom_left = scene.add.image(
      0,
      -17.87410141979456,
      "outside",
      "nature/ramp/stone/bottom_left.png"
    );
    outside_nature_ramp_stone_bottom_left.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_ramp_stone_bottom_left);

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
