// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../../../data/object-names";
/* END-USER-IMPORTS */

export default class WallEmpty extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 80.17556591525863,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_empty.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.015310781444973998 39.49612852219269 32.42741038545539 23.404538823410114 63.96173535968254 39.106815868189884 64.05333914484575 79.87017070349822 31.35107620861019 96.0915312869484 -0.05347788094935879 80.38925424216862"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8351621449506107);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.WallEmpty;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
