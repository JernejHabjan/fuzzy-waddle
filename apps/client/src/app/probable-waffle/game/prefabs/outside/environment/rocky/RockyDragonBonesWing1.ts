
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyDragonBonesWing1 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 19.690711322009392, y ?? -0.9859447389422371, texture || "environment_1", frame ?? "rocky/Dragon_bones_wing1_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("57.59330548963378 131.4286342061113 140.22301330199946 104.51138090359825 203.44725943115805 116.40505096749936 194.66831401321076 125.68638111651747 133.24463406727415 117.29680531902369 178.40795403347147 147.0782000796654 55.08937494986513 151.46007852426055"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.4519168411015992, 0.5586486533635069);

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
