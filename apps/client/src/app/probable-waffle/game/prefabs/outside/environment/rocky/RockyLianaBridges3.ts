
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyLianaBridges3 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "rocky/Liana_bridges3_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("80.92329494518737 68.35541145886504 114.5737115886962 83.47371458855741 104.81996763405596 109.80882326608605 16.0608976468298 71.28153464525712 10.208651274045678 38.60649239721232 21.425456821881937 20.074378883395866"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.75);

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
