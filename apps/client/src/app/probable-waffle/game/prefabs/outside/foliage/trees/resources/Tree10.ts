// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Tree10 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 92, y ?? 163, texture || "outside", frame ?? "foliage/trees/resources/tree10.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "4.193840323421412 29.447687344756716 47.028453916909534 15.89999560356047 87.87075990139822 30.443841149256443 84.88229848789904 47.77691734755164 63.365376310705 73.27845474274457 53.20460750480782 76.66537767804363 51.411530656708315 86.62691572304087 37.26614663281224 86.02922344034103 35.67230054561268 64.31307050224704 3.596148040721573 42.19845604235318"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;
    this.setOrigin(0.5, 0.8833026541239049);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Tree10;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
