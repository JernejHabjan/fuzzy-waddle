// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Tree5 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 160);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-18.328564034534246 -41.683108304793414 -0.3179014988837494 -73.02166111682527 16.251908033914702 -53.209932327609735 23.095959797461894 2.98333478361981 5.805723763237417 24.596129826400414 4.00465750967237 35.40252734779071 -4.2802472567268595 35.40252734779071 -6.441526761004919 19.55314431641827 -24.452189296655416 4.784401037184864"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;

    // outside_foliage_trees_resources_tree5
    const outside_foliage_trees_resources_tree5 = scene.add.image(
      0,
      -16.847000446527897,
      "outside",
      "foliage/trees/resources/tree5.png"
    );
    outside_foliage_trees_resources_tree5.setOrigin(0.5, 0.4867656180230016);
    this.add(outside_foliage_trees_resources_tree5);

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
