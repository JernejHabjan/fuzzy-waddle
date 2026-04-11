// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
/* END-USER-IMPORTS */

export default class CursedLandSpikePlant1 extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 40.06285700295234, y ?? 44.92000073450029, texture || "environment_1", frame ?? "cursed_land/Spike_plant_shadow1_1.png");

    this.setInteractive(new Phaser.Geom.Polygon("49.08360343499368 82.32651579700044 135.72002218176033 80.35750628002847 206.6043647927512 54.760382559392866 176.41288553251434 92.1715633818603 154.0974443401654 156.49254093627798 112.74824448375404 164.36857900416587 95.68349533666361 116.45601409118126"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5275892851677826, 0.6051562528691418);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  // TODO: Wire up remaining animation frames / asset variants:
  //   - cursed_land/Spike_plant_shadow1_2.png
  //   - cursed_land/Spike_plant_shadow1_3.png
  //   - cursed_land/Spike_plant_shadow1_4.png

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
