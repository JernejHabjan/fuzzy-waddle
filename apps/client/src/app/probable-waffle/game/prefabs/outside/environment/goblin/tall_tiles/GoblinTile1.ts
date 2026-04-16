// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class GoblinTile1 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "goblin/tall tiles/dark_1.png");

    this.setInteractive(new Phaser.Geom.Polygon("0 8 16 0 32 8 32 23.579037768961776 16.245869332025052 32.090747390849664 0.05285734480223425 23.16383052609863"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null, true);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
