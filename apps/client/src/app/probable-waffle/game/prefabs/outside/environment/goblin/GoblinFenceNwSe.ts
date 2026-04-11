// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class GoblinFenceNwSe extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "goblin/fence_nw_se.png");

    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, 16, 32), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, ["goblin/fence_nw_se.png", "goblin/fence_nw_se_2.png", "goblin/fence_nw_se_3.png", "goblin/fence_nw_se_4.png"]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
