// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockPiles6 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-32 -32 -10.466571191976673 -32.54127974661799 11.806381513470384 -21.705789241265364 23.093350789879374 -1.2387516200437432 11.806381513470384 9.59673888530888 4.733214100254088 7.640330877397993 -4.446854244558548 12.456104435332492 -31.98714686381638 0.6221098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_rock_piles_6
    const outside_nature_rock_piles_6 = scene.add.image(0, -17.87410141979456, "outside", "nature/rock_piles/6.png");
    outside_nature_rock_piles_6.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_rock_piles_6);

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
