// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockPiles3 extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-25.770563861536058 -11.05850388335869 -16.91512251843518 -14.574635004884037 -5.976047918134093 -32.2855176910858 -6.6271833110091585 -36.45278420548621 -0.506510617983551 -42.05254858421176 13.818468025267869 -33.3273343196859 27.492311275644226 -4.156468718883005 5.744389153617071 12.121916102993609 -5.194685446684016 6.522151724268056 -12.878083082609777 9.908055767218386 -27.463515883011226 0.7921602669674854"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_nature_rock_piles_3
    const outside_nature_rock_piles_3 = scene.add.image(0, -17.87410141979456, "outside", "nature/rock_piles/3.png");
    outside_nature_rock_piles_3.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_rock_piles_3);

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
