// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RampStoneTopRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-11.47784760037866 -20.430076407574912 0.11236239279749327 -41.52686313672701 27.46004889355021 -32.4109676364761 29.82786052149946 1.6522508487481744 -0.1480917643525359 12.25692031475333 -25.67259916505507 -1.6773770927730496 -21.76578680780468 -13.918722478824264"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_ramp_stone_top_right
    const outside_nature_ramp_stone_top_right = scene.add.image(
      0,
      -17.87410141979456,
      "outside",
      "nature/ramp/stone/top_right.png"
    );
    outside_nature_ramp_stone_top_right.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_ramp_stone_top_right);

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
