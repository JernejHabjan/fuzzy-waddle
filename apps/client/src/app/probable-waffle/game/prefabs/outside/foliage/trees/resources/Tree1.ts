// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Tree1 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 348.0602852374069);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-27.862347263091753 -77.60610819112789 -1.6363241440769727 -130.05815442915744 22.632533070533718 -92.48056906459895 28.09918858249329 -51.03929790889784 6.5543968367218 -18.392904645403036 5.204032881692719 5.09670439248319 -5.868115903051976 4.577697418198255 -6.156800195497937 -20.208789935720148 -23.105062905124257 -29.893511484078033"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;

    // outside_foliage_trees_resources_tree1
    const outside_foliage_trees_resources_tree1 = scene.add.image(
      0,
      -80.53014195357605,
      "outside",
      "foliage/trees/resources/tree1.png"
    );
    outside_foliage_trees_resources_tree1.setOrigin(0.5, 0.4867656180230016);
    this.add(outside_foliage_trees_resources_tree1);

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
