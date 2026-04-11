
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyDragonBonesWing2 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.6979826031615, y ?? 9.341773204672016, texture || "environment_1", frame ?? "rocky/Dragon_bones_wing2_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("0 32 7.1157685023614405 16.277058363773612 50.60627314159995 24.73354537695888 81.71406465438861 15.068988790461432 128 32 122.18439536034668 100.84192849562626 47.58609920831952 114.73472858871634"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.4976404890871992, 0.4479826031615001);

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
