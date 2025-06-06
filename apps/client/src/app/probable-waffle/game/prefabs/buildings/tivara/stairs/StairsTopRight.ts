// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class StairsTopRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "factions", frame ?? "buildings/tivara/stairs/stairs_top_right.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.18607871435651901 39.916486832392096 24.598136860352366 3.647124084095992 32 0 64 16 63.93398545839214 48.91631275967055 32.40704391838937 64.19225350585745 -0.12184833795624428 47.92130700721276"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  // Write your code here.
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
