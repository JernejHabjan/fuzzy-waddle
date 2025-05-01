// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class TivaraMacemanMale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.35487752340556);

    this.setInteractive(new Phaser.Geom.Circle(0, -25.354877574887297, 32), Phaser.Geom.Circle.Contains);

    // tivara_maceman_male_idle_down
    const tivara_maceman_male_idle_down = scene.add.sprite(0, -25.354877523405563, "maceman_male_idle", 4);
    tivara_maceman_male_idle_down.play("tivara_maceman_male_idle_down");
    this.add(tivara_maceman_male_idle_down);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.TivaraMacemanMale;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
