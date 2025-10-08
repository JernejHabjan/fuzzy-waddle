// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class SkaduweeWarriorMale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.77331682786765);

    this.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);

    // skaduwee_warrior_male_idle_down
    const skaduwee_warrior_male_idle_down = scene.add.sprite(0, -25.773318048605454, "warrior_male_idle", 4);
    skaduwee_warrior_male_idle_down.play("skaduwee_warrior_male_idle_down");
    this.add(skaduwee_warrior_male_idle_down);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.SkaduweeWarriorMale;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
