// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockPiles1 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-25.122610246584916 -6.1665140784925185 4.564578396656913 -25.26596411470404 24.909644739577885 -11.979390176469934 29.476904530845857 0.8919783261943479 0.28628033313970036 16 -27.198637424433993 1.5147864795490733"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_rock_piles_1
    const outside_nature_rock_piles_1 = scene.add.image(0, -17.87410141979456, "outside", "nature/rock_piles/1.png");
    outside_nature_rock_piles_1.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_rock_piles_1);

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
