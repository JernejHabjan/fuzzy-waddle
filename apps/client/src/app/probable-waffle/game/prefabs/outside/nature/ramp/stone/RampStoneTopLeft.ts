// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RampStoneTopLeft extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-28.488201789154495 -31.639226079938894 -1.0147657203234388 -42.36515659996198 7.829422603204371 -31.45105186028937 12.15742965514351 -19.596076022369115 23.07153439481612 -13.574500993584223 25.32962503061045 -0.5904798377668072 3.3132413316157 13.522586635947775 -31.98714686381638 0.6221098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_ramp_stone_top_left
    const outside_nature_ramp_stone_top_left = scene.add.image(
      0,
      -17.87410141979456,
      "outside",
      "nature/ramp/stone/top_left.png"
    );
    outside_nature_ramp_stone_top_left.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_ramp_stone_top_left);

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
