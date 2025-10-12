// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class Tree6 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 350, texture || "outside", frame ?? "foliage/trees/resources/tree6.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "9.977702960675252 80.26137979733159 33.30697223012269 40.04616324714124 61.968645904015254 91.3705556399256 63.96829755568218 119.32084602647369 54.414406331051325 142.872298812773 36.86190849975277 157.31422740814523 39.528110701975336 181.08786371129642 25.308365623454996 179.97694612703702 26.19709969086252 156.86986037444146 9.533335926971493 145.76068453184746 0.6459952528962809 129.5412878016602"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;
    this.setOrigin(0.5, 0.911458);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Tree6;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
