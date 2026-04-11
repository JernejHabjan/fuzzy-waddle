// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class CursedLandRuins1 extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "environment_1", frame ?? "cursed_land/Ruins_shadow1_3.png");

    this.setInteractive(new Phaser.Geom.Polygon("7.450677249991173 25.563976470312532 32 0 53.292994550629004 23.91200107209135 60.72688384262429 43.32271200119025 32.6433020728642 55.29953363829383 0 48"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  // TODO: Wire up remaining animation frames / asset variants:
  //   - cursed_land/Ruins_shadow1_4.png
  //   - cursed_land/Ruins_shadow1_5.png
  //   - cursed_land/Ruins_shadow1_6.png

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
