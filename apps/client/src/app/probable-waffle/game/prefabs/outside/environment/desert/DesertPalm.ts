// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class DesertPalm extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 58.612756745087054, texture || "environment_1", frame ?? "desert/palm/0.png");

    this.setInteractive(new Phaser.Geom.Rectangle(0, 13, 30.52976833420731, 47.840642566460886), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.5, 0.9158243241419852);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  // TODO: Wire up remaining animation frames / asset variants:
  //   - desert/palm/1.png
  //   - desert/palm/2.png
  //   - desert/palm/3.png
  //   - desert/palm/4.png

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
