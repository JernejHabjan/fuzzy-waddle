// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import { setActorData } from "../../../../../data/actor-data";
import { ColliderComponent } from "../../../../../entity/actor/components/collider-component";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RampStoneBottomRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "nature/ramp/stone/bottom_right.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "18.348241305171484 24.09039123800768 41.62321824692961 17.337774470954393 57.57088763294907 16.475738287926315 64.17983170283101 20.498573808724018 63.892486308488316 48.37107705996524 32.71551102230613 63.313037565785265 -0.6165547214462492 46.93435008825177"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    setActorData(this, [new ColliderComponent()], []);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
