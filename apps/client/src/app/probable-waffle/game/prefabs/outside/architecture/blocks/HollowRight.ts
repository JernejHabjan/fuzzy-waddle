// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from '../../../../entity/actor/ActorContainer';
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HollowRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Po'-32 -32 0 -48 32 -32 31.94308756244577 1.2220034195229061 0.28628033313970036 16 -31.98714686381638 0.6221098782742516'21098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_architecture_blocks_hollow_right
    const outside_architecture_blocks_hollow_right = scene.add.image(
      0,
      -16.42350022326395,
      "outside",
      "architecture/blocks/hollow_right.png"
    );
    outside_architecture_blocks_hollow_right.setOrigin(0.5, 0.4933828090115008);
    this.add(outside_architecture_blocks_hollow_right);

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
