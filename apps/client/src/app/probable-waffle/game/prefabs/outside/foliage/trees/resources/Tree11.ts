// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Tree11 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 92, y ?? 169, texture || "outside", frame ?? "foliage/trees/resources/tree11.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "3.784376857318719 27.45468445486062 20.869663472802703 17.062602905236346 48.523168613328316 11.073945741046074 91.1483166643296 21.289890315252997 88.15398808223446 46.12520384910084 57.33001738419635 60.04002490707233 59.795935040039396 89.80717375260627 35.66516940786099 90.5117216542757 30.733334096174897 84.52306449008546 40.24473076871237 63.73890139083691 29.32423829283601 46.301340824518206 7.307116365665934 36.43767020114601"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;
    this.setOrigin(0.5, 0.917368042051417);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Tree11;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
