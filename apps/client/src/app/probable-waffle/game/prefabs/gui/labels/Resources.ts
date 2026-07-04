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
    const resources_bg_1 = scene.add.nineslice(0, 0, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 50, 10, 1, 1, 1, 1);
    resources_bg_1.scaleX = 4.62;
    resources_bg_1.scaleY = 2.8023638778148445;
    resources_bg_1.setOrigin(0, 0);
    resources_container.add(resources_bg_1);

    // housing
    const housing = new Resource(scene, 210, 21);
    housing.scaleX = 0.5;
    housing.scaleY = 0.5;
    resources_container.add(housing);
    housing.resource_icon.setTexture("gui", "resource_icons/food.png");
    housing.resource_icon.scaleX = 1;
    housing.resource_icon.scaleY = 1;

    // minerals
    const minerals = new Resource(scene, 168, 21);
    minerals.scaleX = 0.5;
    minerals.scaleY = 0.5;
    resources_container.add(minerals);
    minerals.resource_icon.setTexture("gui", "resource_icons/minerals.png");
    minerals.resource_icon.scaleX = 1;
    minerals.resource_icon.scaleY = 1;

    // stone
    const stone = new Resource(scene, 126, 21);
    stone.scaleX = 0.5;
    stone.scaleY = 0.5;
    resources_container.add(stone);
    stone.resource_icon.setTexture("gui", "resource_icons/stone.png");
    stone.resource_icon.scaleX = 1;
    stone.resource_icon.scaleY = 1;

    // wood
    const wood = new Resource(scene, 84, 21);
    wood.scaleX = 0.5;
    wood.scaleY = 0.5;
    resources_container.add(wood);
    wood.resource_icon.setTexture("gui", "resource_icons/wood.png");
    wood.resource_icon.scaleX = 1;
    wood.resource_icon.scaleY = 1;

    // food
    const food = new Resource(scene, 42, 21);
    food.scaleX = 0.5;
    food.scaleY = 0.5;
    resources_container.add(food);
    food.resource_icon.setTexture("gui", "resource_icons/food.png");
    food.resource_icon.scaleX = 1;
    food.resource_icon.scaleY = 1;

    // housing (prefab fields)
    housing.type = "housing";

    // minerals (prefab fields)
    minerals.type = "minerals";

    // stone (prefab fields)
    stone.type = "stone";

    // wood (prefab fields)
    wood.type = "wood";

    // food (prefab fields)
    food.type = "food";

    this.resources_container = resources_container;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private resources_container: Phaser.GameObjects.Container;

  /* START-USER-CODE */

  private readonly resourceTypes = ["food", "wood", "stone", "minerals", "housing"] as const;

  setMobileLayout(isMobile: boolean) {
    const background = this.resources_container.list.find(
      (child): child is Phaser.GameObjects.NineSlice => child instanceof Phaser.GameObjects.NineSlice
    );
    const resources = this.resourceTypes
      .map((type) =>
        this.resources_container.list.find(
          (child): child is Resource => child instanceof Resource && child.type === type
        )
      )
      .filter((resource): resource is Resource => !!resource);

    this.resources_container.setScale(isMobile ? 1 : 2);

    if (background) {
      background.setSize(isMobile ? 92 : 50, isMobile ? 214 : 10);
      background.scaleX = isMobile ? 0.7 : 4.62;
      background.scaleY = isMobile ? 0.5 : 2.8023638778148445;
    }

    resources.forEach((resource, index) => {
      resource.x = isMobile ? 42 : 42 + index * 42;
      resource.y = isMobile ? 21 + index * 21: 21;
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
