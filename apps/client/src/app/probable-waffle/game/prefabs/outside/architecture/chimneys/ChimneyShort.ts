// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ChimneyShort extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 16, y ?? 32);

    this.removeInteractive();

    // outside_architecture_chimneys_chimney_short
    const outside_architecture_chimneys_chimney_short = scene.add.image(
      0,
      -16,
      "outside",
      "architecture/chimneys/chimney_short.png"
    );
    this.add(outside_architecture_chimneys_chimney_short);

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
