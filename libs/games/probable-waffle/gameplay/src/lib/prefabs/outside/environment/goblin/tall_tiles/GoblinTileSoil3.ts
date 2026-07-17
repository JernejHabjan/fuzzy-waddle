// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class GoblinTileSoil3 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "goblin/tall tiles/soil_3.png");

    this.setInteractive(new Phaser.Geom.Polygon("0 8 16 0 32 8 32 23.78514078322675 16.220698712494226 31.957883419963927 -0.06093649205248042 23.529742843492684"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null, true);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
