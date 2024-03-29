// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import { setActorData } from "../../../../../data/actor-data";
import { ColliderComponent } from "../../../../../entity/actor/components/collider-component";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RampStoneTopLeft extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 32, texture || "outside", frame ?? "nature/ramp/stone/top_left.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "3.728158169625001 16.97440894928123 32.088604325124614 6.525823523570846 42.00409865768651 25.61048465828675 53.412248051064175 33.606851055514085 57.89021323351148 45.867946197929335 34.64744157223736 60.68787858745733 1.4891755784013476 48.10692878915299"
      ),
      Phaser.Geom.Polygon.Contains
    );

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
