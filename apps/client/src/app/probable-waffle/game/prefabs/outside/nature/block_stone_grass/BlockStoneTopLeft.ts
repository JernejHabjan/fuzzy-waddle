// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BlockStoneTopLeft extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-32 -32 0 -48 32 -32 31.94308756244577 1.2220034195229061 0.28628033313970036 16 -31.98714686381638 0.6221098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_block_stone_grass_top_left
    const outside_nature_block_stone_grass_top_left = scene.add.image(
      0,
      -17.87410141979456,
      "outside",
      "nature/block_stone_grass/top_left.png"
    );
    outside_nature_block_stone_grass_top_left.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_block_stone_grass_top_left);

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
