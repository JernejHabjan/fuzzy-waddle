// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Tree6 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 352.80224260710486);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-27.808172867632734 -79.78225154635899 -1.053496160903876 -136.82894483574324 22.57143521003693 -107.40139874211522 28.061089611147928 -35.591790582944526 4.674648072005091 -21.00515225255461 4.985488463771958 3.2403983052611807 -6.20476563983533 3.3958185011446176 -5.1168242686512855 -22.55935421138895 -25.166029537614346 -32.817087139695616"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;

    // outside_foliage_trees_resources_tree6
    const outside_foliage_trees_resources_tree6 = scene.add.image(
      0,
      -82.74812175008033,
      "outside",
      "foliage/trees/resources/tree6.png"
    );
    outside_foliage_trees_resources_tree6.setOrigin(0.5, 0.4867656180230016);
    this.add(outside_foliage_trees_resources_tree6);

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
