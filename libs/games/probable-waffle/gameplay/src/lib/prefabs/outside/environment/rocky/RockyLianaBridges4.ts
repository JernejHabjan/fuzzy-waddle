
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyLianaBridges4 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 34.91387475626243, y ?? 19.40760395417489, texture || "environment_1", frame ?? "rocky/Liana_bridges4_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("31.28444215366511 61.59238084690013 90.0473116039347 36.902099565274256 94.49156223462737 60.11096397000259 49.308347489252014 89.98620432076989 30.04992808958383 78.62867493122198"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5227646465333002, 0.5266219058919913);

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
