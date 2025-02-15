// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopLeftBottomRightBottomLeft extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 80,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_top_left_bottom_right_bottom_left.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0 24 7.934866938551643 18.74010259348985 17.75235106175054 16.351488606170193 23.420276481134657 19.752243857800664 24.39192083874336 11.007444639322316 32.48895715214923 7.930570840228086 40.17231611515135 12.559410398903523 40.39527472985901 28.38947204314789 48.05018716815559 31.80817080199879 48.27314578286325 24.078938825466324 55.92805822115982 20.585920528379546 64 24 64.05717051830713 80.06848130994683 31.641673223508523 96.1315179158515 0.09444817767773728 80.50261743443075"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8269193886139364);

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
