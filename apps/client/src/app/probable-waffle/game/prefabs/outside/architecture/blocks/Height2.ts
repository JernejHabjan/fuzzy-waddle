// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { ColliderComponent } from "../../../../entity/actor/components/collider-component";
/* END-USER-IMPORTS */

export default class Height2 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "architecture/blocks/height_2.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0.12041487071155643 32.03820250156864 31.96836329572791 15.341219832142592 64.280116794895 31.88360081018507 64.280116794895 47.96217671407682 32.27756667849506 64.19535430935215 0.12041487071155643 47.652973331309674"
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
