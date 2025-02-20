// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopLeftTopRightBottomRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 80,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_top_left_top_right_bottom_right.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "7.584451360795956 27.3624245812113 8.234414030166832 19.562872548760765 17.75235106175054 16.351488606170193 23.420276481134657 19.752243857800664 24.39192083874336 11.007444639322316 32.48895715214923 7.930570840228086 40.17231611515135 12.559410398903523 40.08258482933982 19.042902413264066 46.84219659079695 15.793089066409678 51.39193527639309 16.18306666803221 55.92805822115982 20.585920528379546 64 24 64.05717051830713 80.06848130994683 31.641673223508523 96.1315179158515 0.09444817767773728 80.50261743443075 0.013226562494068617 31.91265029088069"
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
