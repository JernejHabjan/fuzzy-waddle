// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class TivaraDockFoundation1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(new Phaser.Geom.Polygon("-64 -48 0 -80 64 -48 64 16 0 48 -64 16"), Phaser.Geom.Polygon.Contains);

    // tivaraDockFoundation1Image
    const tivaraDockFoundation1Image = scene.add.image(0, -32, "factions", "buildings/tivara/dock/tivara-dock1.png");
    this.add(tivaraDockFoundation1Image);

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
