// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class StonePile extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 47.223497563360624, texture || "outside", frame ?? "nature/resources/stone_pile_1.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "5.025616438265331 39.13261986381158 32.15891862605808 25.16299893544304 60.36680703910994 35.10292151908988 63.590565714887305 49.072542447458424 34.03944452026154 63.57945648845653 0.45862498091407744 47.72930966588453"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.7378671494275097);

    /* START-USER-CTR-CODE */
    this.setFrame(
      `nature/resources/${this.availableRockPiles[Math.floor(Math.random() * this.availableRockPiles.length)]}`
    );
    // randomly flip by Y axis
    if (Math.random() > 0.5) {
      this.flipX = true;
    }
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.StonePile;
  private readonly availableRockPiles = ["stone_pile_1.png", "stone_pile_2.png"];

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
