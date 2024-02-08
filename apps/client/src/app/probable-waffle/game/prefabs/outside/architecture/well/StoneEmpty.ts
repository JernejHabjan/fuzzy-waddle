// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { ColliderComponent } from "../../../../entity/actor/components/collider-component";
/* END-USER-IMPORTS */

export default class StoneEmpty extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "architecture/well/stone_empty.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.012661433720367654 40.40835796674999 31.947659295784383 23.63752955685618 64.1260805524451 39.20773339072427 64.1260805524451 48.75745840883003 32.155263209846424 64 -0.23076196087633605 47.51184210212059"
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
