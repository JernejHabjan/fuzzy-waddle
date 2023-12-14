// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockPiles5 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-7.717045086867564 -20.29693690228904 20.33095501723532 -31.92043244092627 32 -32 31.94308756244577 1.2220034195229061 2.8957117092794746 13.057441599887362 -22.878126224220473 -2.103639537465547"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_rock_piles_5
    const outside_nature_rock_piles_5 = scene.add.image(0, -17.87410141979456, "outside", "nature/rock_piles/5.png");
    outside_nature_rock_piles_5.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_rock_piles_5);

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
