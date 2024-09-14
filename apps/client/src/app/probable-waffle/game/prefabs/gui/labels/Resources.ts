
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import Resource from "./Resource";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Resources extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // resources_container
    const resources_container = scene.add.container(0, 0);
    resources_container.scaleX = 2;
    resources_container.scaleY = 2;
    this.add(resources_container);

    // resources_bg_1
    const resources_bg_1 = scene.add.nineslice(0, 0, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 40, 10, 1, 1, 1, 1);
    resources_bg_1.scaleX = 2.4760291594973083;
    resources_bg_1.scaleY = 2.8023638778148445;
    resources_bg_1.setOrigin(0, 0);
    resources_container.add(resources_bg_1);

    // resource_3
    const resource_3 = new Resource(scene, 105, 21);
    resource_3.scaleX = 0.5;
    resource_3.scaleY = 0.5;
    resources_container.add(resource_3);

    // resource_4
    const resource_4 = new Resource(scene, 74, 21);
    resource_4.scaleX = 0.5;
    resource_4.scaleY = 0.5;
    resources_container.add(resource_4);

    // resource_5
    const resource_5 = new Resource(scene, 42, 21);
    resource_5.scaleX = 0.5;
    resource_5.scaleY = 0.5;
    resources_container.add(resource_5);

    this.resources_container = resources_container;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private resources_container: Phaser.GameObjects.Container;

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
