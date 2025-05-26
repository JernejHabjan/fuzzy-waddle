// You can write more code here

/* START OF COMPILED CODE */

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
    resources_bg_1.scaleX = 3.9745690975308436;
    resources_bg_1.scaleY = 2.8023638778148445;
    resources_bg_1.setOrigin(0, 0);
    resources_container.add(resources_bg_1);

    // food
    const food = new Resource(scene, 156, 21);
    food.scaleX = 0.5;
    food.scaleY = 0.5;
    resources_container.add(food);
    food.resource_icon.setTexture("gui", "resource_icons/food.png");
    food.resource_icon.scaleX = 1;
    food.resource_icon.scaleY = 1;

    // minerals
    const minerals = new Resource(scene, 119, 21);
    minerals.scaleX = 0.5;
    minerals.scaleY = 0.5;
    resources_container.add(minerals);
    minerals.resource_icon.setTexture("gui", "resource_icons/minerals.png");
    minerals.resource_icon.scaleX = 1;
    minerals.resource_icon.scaleY = 1;

    // stone
    const stone = new Resource(scene, 80, 21);
    stone.scaleX = 0.5;
    stone.scaleY = 0.5;
    resources_container.add(stone);
    stone.resource_icon.setTexture("gui", "resource_icons/stone.png");
    stone.resource_icon.scaleX = 1;
    stone.resource_icon.scaleY = 1;

    // wood
    const wood = new Resource(scene, 42, 21);
    wood.scaleX = 0.5;
    wood.scaleY = 0.5;
    resources_container.add(wood);
    wood.resource_icon.setTexture("gui", "resource_icons/wood.png");
    wood.resource_icon.scaleX = 1;
    wood.resource_icon.scaleY = 1;

    // food (prefab fields)
    food.type = "food";

    // minerals (prefab fields)
    minerals.type = "minerals";

    // stone (prefab fields)
    stone.type = "stone";

    // wood (prefab fields)
    wood.type = "wood";

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
