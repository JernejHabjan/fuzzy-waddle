
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Resource extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 71.80414581298828, y ?? 32.202178808720916);

    // resource_text
    const resource_text = scene.add.text(-39, -20, "", {});
    resource_text.text = "0";
    this.add(resource_text);

    // resource_icon
    const resource_icon = scene.add.image(-56, -4, "factions", "character_icons/general/warrior.png");
    resource_icon.scaleX = 0.5;
    resource_icon.scaleY = 0.5;
    resource_icon.setOrigin(0.5, 0.9);
    this.add(resource_icon);

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
