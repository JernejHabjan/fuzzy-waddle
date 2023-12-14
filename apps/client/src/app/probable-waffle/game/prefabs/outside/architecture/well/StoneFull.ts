// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from '../../../../entity/actor/ActorContainer';
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class StoneFull extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Po'-31.970945813448747 -8.425157501202627 0.2079425134422337 -24.255094500721576 31.867816512480132 -8.425157501202627 31.94308756244577 1.2220034195229061 0.28628033313970036 16 -31.98714686381638 0.6221098782742516'21098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_architecture_well_stone_full
    const outside_architecture_well_stone_full = scene.add.image(
      0,
      -15.681967484131384,
      "outside",
      "architecture/well/stone_full.png"
    );
    outside_architecture_well_stone_full.setOrigin(0.5, 0.5049692580604471);
    this.add(outside_architecture_well_stone_full);

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
