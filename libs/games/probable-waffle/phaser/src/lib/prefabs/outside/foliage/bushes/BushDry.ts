// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { BushRustleComponent } from "./components/bush-rustle.component";
import { BushComponent } from "./components/bush.component";
/* END-USER-IMPORTS */

export default class BushDry extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "foliage/bushes/bush_dry.png");

    this.setInteractive(new Phaser.Geom.Circle(35, 35, 24), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    new BushComponent(this, 0x666666);
    new BushRustleComponent(this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
