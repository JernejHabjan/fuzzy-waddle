// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { BushRustleComponent } from "./bush-rustle.component";
/* END-USER-IMPORTS */

export default class BushDownwardsSmall extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "foliage/bushes/bush_downwards_small.png");

    this.setInteractive(new Phaser.Geom.Ellipse(34, 40, 54, 36), Phaser.Geom.Ellipse.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    new BushRustleComponent(this, 0x468c41);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
