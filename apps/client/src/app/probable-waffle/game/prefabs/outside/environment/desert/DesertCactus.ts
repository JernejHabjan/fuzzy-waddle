// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class DesertCactus extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 33.88174216533671, y ?? 58.161407692818244, texture || "environment_1", frame ?? "desert/cactus/0.png");

    this.setInteractive(new Phaser.Geom.Rectangle(10, 14, 17.79736749071823, 45.90528652595529), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.5588044426667722, 0.9087719952002851);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  // TODO: Wire up remaining animation frames / asset variants:
  //   - desert/cactus/1.png
  //   - desert/cactus/2.png
  //   - desert/cactus/3.png
  //   - desert/cactus/4.png
  //   - desert/cactus/5.png
  //   - desert/cactus/6.png
  //   - desert/cactus/7.png

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
