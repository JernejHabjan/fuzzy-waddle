// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from '../../../../../entity/actor/ActorContainer';
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Tree5 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 221.42563503512523);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Po'-25.159565619192996 -47.761600453826134 -2.884335461153192 -103.78717933616866 18.378384235157526 -71.72434804808108 23.167120355607608 -27.317839464219105 13.178584756039967 -12.005446686633107 3.605442204035377 -7.31656053871248 2.433220667055224 4.014914318762351 -3.623257274008907 3.6241738064356213 -5.1862193233157825 -10.83322514965296 -14.931623322607877 -19.489330489243315'89330489243315"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;

    // outside_foliage_trees_resources_tree5
    const outside_foliage_trees_resources_tree5 = scene.add.image(
      0,
      -47.55981796409051,
      'outside',
      'foliage/trees/resources/tree5.png'
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
