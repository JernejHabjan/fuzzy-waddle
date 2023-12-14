// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BushDry extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(new Phaser.Geom.Ellipse(2, -9, 54, 36), Phaser.Geom.Ellipse.Contains);

    // outside_foliage_bushes_bush_dry
    const outside_foliage_bushes_bush_dry = scene.add.image(
      0,
      -16.847000446527897,
      "outside",
      "foliage/bushes/bush_dry.png"
    );
    outside_foliage_bushes_bush_dry.setOrigin(0.5, 0.4867656180230016);
    this.add(outside_foliage_bushes_bush_dry);

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
