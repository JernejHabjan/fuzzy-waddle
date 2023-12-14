// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Tree7 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 221.94907843953087);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-20.396613510853534 -43.52284503751888 -0.432119114370046 -92.05188003256328 16.348329368487995 -50.237158256338326 16.348329368487995 -6.842990726275346 2.962709651026543 -7.137180170615153 3.244131880335928 3.7723068427119273 -3.6118565368789994 3.5844715436101495 -3.5980361682551347 -7.281372386423541 -23.63563713262107 -10.484804095490034"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;

    // outside_foliage_trees_resources_tree7
    const outside_foliage_trees_resources_tree7 = scene.add.image(
      0,
      -47.82153966629333,
      "outside",
      "foliage/trees/resources/tree7.png"
    );
    outside_foliage_trees_resources_tree7.setOrigin(0.5, 0.4867656180230016);
    this.add(outside_foliage_trees_resources_tree7);

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
