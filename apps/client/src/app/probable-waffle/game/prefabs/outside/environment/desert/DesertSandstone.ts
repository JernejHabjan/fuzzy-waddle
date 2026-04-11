// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class DesertSandstone extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "desert/sandstone/0.png");

    this.setInteractive(new Phaser.Geom.Circle(17, 18, 11.521975881807764), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  // TODO: Wire up remaining animation frames / asset variants:
  //   - desert/sandstone/1.png
  //   - desert/sandstone/2.png
  //   - desert/sandstone/3.png
  //   - desert/sandstone/4.png
  //   - desert/sandstone/5.png
  //   - desert/sandstone/6.png
  //   - desert/sandstone/7.png
  //   - desert/sandstone/8.png
  //   - desert/sandstone/9.png
  //   - desert/sandstone/10.png

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
