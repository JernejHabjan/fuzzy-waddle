// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class SkaduweeMagicianFemale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.57118202562538);

    this.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);

    // skaduwee_magician_female_idle_down
    const skaduwee_magician_female_idle_down = scene.add.sprite(0, -25.571183923696843, "magician_female_idle", 4);
    skaduwee_magician_female_idle_down.play("skaduwee_magician_female_idle_down");
    this.add(skaduwee_magician_female_idle_down);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.SkaduweeMagicianFemale;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
