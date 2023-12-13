// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class LeavesSmall extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(new Phaser.Geom.Ellipse(2, -13, 34, 20), Phaser.Geom.Ellipse.Contains);

    // outside_foliage_bushes_leaves_small
    const outside_foliage_bushes_leaves_small = scene.add.image(
      0,
      -16.847000446527897,
      "outside",
      "foliage/bushes/leaves_small.png"
    );
    outside_foliage_bushes_leaves_small.setOrigin(0.5, 0.4867656180230016);
    this.add(outside_foliage_bushes_leaves_small);

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
