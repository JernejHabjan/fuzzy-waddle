// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Height3 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-32.08995245226069 -24.202846169736024 0.1107502949021395 -40.48615608165359 31.945535965392658 -23.836929093063716 31.94308756244577 1.2220034195229061 0.28628033313970036 16 -31.98714686381638 0.6221098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_architecture_blocks_height_3
    const outside_architecture_blocks_height_3 = scene.add.image(
      0,
      -16.716490870088737,
      "outside",
      "architecture/blocks/height_3.png"
    );
    outside_architecture_blocks_height_3.setOrigin(0.5, 0.4888048301548635);
    this.add(outside_architecture_blocks_height_3);

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
