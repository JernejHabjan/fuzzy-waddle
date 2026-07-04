// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class GoblinCartTrack extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 41.53707988719502, texture || "environment_1", frame ?? "goblin/cart_track.png");

    this.setInteractive(new Phaser.Geom.Polygon("3.035878140551034 13.652822974183877 16.75715499453817 6.69275500477011 22.722927539749975 9.07906402285483 29.881854594004125 15.541984280167611 17.85087996116033 22.502052249581375"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.5480337464748444);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
