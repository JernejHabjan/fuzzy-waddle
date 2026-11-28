// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class SkaduweeGranaryFoundation2 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(new Phaser.Geom.Polygon("-64 -48 0 -80 64 -48 64 16 0 48 -64 16"), Phaser.Geom.Polygon.Contains);

    // skaduweeGranaryFoundation2Image
    const skaduweeGranaryFoundation2Image = scene.add.image(0, -32, "factions", "buildings/skaduwee/granary/skaduwee-granary2.png");
    this.add(skaduweeGranaryFoundation2Image);

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
