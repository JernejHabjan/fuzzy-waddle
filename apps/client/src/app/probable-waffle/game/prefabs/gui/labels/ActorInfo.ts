
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ActorInfo extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 439, y ?? 179);

    this.scaleX = 2.046615132804262;
    this.scaleY = -2.2016637475156924;

    // actor_info_bg
    const actor_info_bg = scene.add.nineslice(-214.7589702691498, -0.0028799829059096282, "gui", "cryos_mini_gui/surfaces/surface_parchment.png", 32, 16, 3, 3, 3, 3);
    actor_info_bg.scaleX = 6.711135518221706;
    actor_info_bg.scaleY = 5.076854073573915;
    actor_info_bg.setOrigin(0, 0);
    this.add(actor_info_bg);

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
