// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockPiles2 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-22.14014494534083 -20.017403504972414 -14.45884438729924 -36.41801820998013 -2.002681320204765 -39.116853541183936 26.0236855807578 -16.072951867059164 26.231288298542708 -1.7483643399005189 4.640605648912285 12.161017751688306 -31.98714686381638 0.6221098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_rock_piles_2
    const outside_nature_rock_piles_2 = scene.add.image(0, -17.87410141979456, "outside", "nature/rock_piles/2.png");
    outside_nature_rock_piles_2.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_rock_piles_2);

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
