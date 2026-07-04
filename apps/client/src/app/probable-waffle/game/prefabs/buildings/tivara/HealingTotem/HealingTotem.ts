// You can write more code here

/* START OF COMPILED CODE */

import OlivalCursor from "../Olival/OlivalCursor";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { setActorData } from "../../../../data/actor-data";
/* END-USER-IMPORTS */

export default class HealingTotem extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 108);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-12.788011962835393 -30.360902541923828 0.5188883965774025 -42.99403579453091 13.657346979288771 -31.70843675553525 15.004881192900193 -10.484772891155345 13.994230532691624 5.854079448883155 -14.809313283252527 5.685637672181727 -15.819963943461094 -10.484772891155345"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;

    // olivalCursor
    const olivalCursor = new OlivalCursor(scene, 0, 0);
    olivalCursor.visible = true;
    this.add(olivalCursor);

    this.olivalCursor = olivalCursor;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private olivalCursor: OlivalCursor;

  /* START-USER-CODE */
  override name = ObjectNames.HealingTotem;

  private setup() {
    setActorData(
      this,
      [
        // todo?
      ],
      []
    );
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
