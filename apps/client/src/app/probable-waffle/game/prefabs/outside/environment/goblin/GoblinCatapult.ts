// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class GoblinCatapult extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "goblin/catapult.png");

    this.setInteractive(new Phaser.Geom.Polygon("0 16 10.980041404993699 8.008182679352757 46.60858207777301 23.42194850232822 58.484762302032806 9.271606107465502 80 16 73.89852812500826 42.373299924019356 43.82905053592498 61.83002071695558 -1.1488235048886395 42.625984609641904"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
