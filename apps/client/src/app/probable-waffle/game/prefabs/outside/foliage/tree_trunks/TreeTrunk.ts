// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class TreeTrunk extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 15.406372095183762);

    this.removeInteractive();
    this.setInteractive(new Phaser.Geom.Rectangle(-3, -8, 6, 10), Phaser.Geom.Rectangle.Contains);

    // outside_foliage_tree_trunks_tree_trunk
    const outside_foliage_tree_trunks_tree_trunk = scene.add.image(
      0,
      0.5936279048162376,
      "outside",
      "foliage/tree_trunks/tree_trunk.png"
    );
    outside_foliage_tree_trunks_tree_trunk.setOrigin(0.5, 0.4867656180230016);
    this.add(outside_foliage_tree_trunks_tree_trunk);

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
