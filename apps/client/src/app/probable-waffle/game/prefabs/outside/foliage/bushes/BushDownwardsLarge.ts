// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { BushRustleComponent } from "./bush-rustle.component";
import { BushComponent } from "./bush.component";
import { SpawnBerryComponent } from "./spawn-berry.component";
/* END-USER-IMPORTS */

export default class BushDownwardsLarge extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "foliage/bushes/bush_downwards_large.png");

    this.setInteractive(new Phaser.Geom.Ellipse(32, 32, 50, 40), Phaser.Geom.Ellipse.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    new BushComponent(this, 0x468c41);
    new BushRustleComponent(this);
    new SpawnBerryComponent(this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
