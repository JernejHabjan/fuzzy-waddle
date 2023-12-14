// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Tree4 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 221.5581291013792);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-18.31485147180034 -47.83907241987676 -1.011626666093413 -99.74874683699754 17.44514645999398 -62.450684478029274 18.253533644300454 -26.750038772528 4.340605951182383 3.360511643997924 -3.6638844429283175 3.2422175573640146 -12.892271005972013 -22.90487770459312"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;

    // outside_foliage_trees_resources_tree4
    const outside_foliage_trees_resources_tree4 = scene.add.image(
      0,
      -47.62606221472109,
      "outside",
      "foliage/trees/resources/tree4.png"
    );
    outside_foliage_trees_resources_tree4.setOrigin(0.5, 0.4867656180230016);
    this.add(outside_foliage_trees_resources_tree4);

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
