// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BushUpwardsSmall extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(new Phaser.Geom.Ellipse(14, -6, 30, 30), Phaser.Geom.Ellipse.Contains);

    // outside_foliage_bushes_bush_upwards_small
    const outside_foliage_bushes_bush_upwards_small = scene.add.image(
      0,
      -16.847000446527897,
      "outside",
      "foliage/bushes/bush_upwards_small.png"
    );
    outside_foliage_bushes_bush_upwards_small.setOrigin(0.5, 0.4867656180230016);
    this.add(outside_foliage_bushes_bush_upwards_small);

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
