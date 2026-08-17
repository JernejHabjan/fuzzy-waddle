import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

import Resource from "./Resource";
/* START-USER-IMPORTS */
import type { ScenarioPresentationPolicy } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  createScenarioResourceHudLayout,
  resolveScenarioResourceHudEntries,
  type ScenarioResourceHudEntry
} from "./scenario-resource-hud-projection";
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

  private visibleEntries = resolveScenarioResourceHudEntries();
  private isMobileLayout = false;

  /**
   * Applies scenario-authored visibility while leaving player economy state untouched.
   * Missing policy data deliberately restores the legacy complete HUD.
   */
  setScenarioPresentationPolicy(policy?: ScenarioPresentationPolicy): void {
    this.visibleEntries = resolveScenarioResourceHudEntries(policy);
    const visibleTypes = new Set<ScenarioResourceHudEntry>(this.visibleEntries);
    for (const child of this.resources_container.list) {
      if (child instanceof Resource) child.setVisible(child.type !== "" && visibleTypes.has(child.type));
    }
    this.setVisible(this.visibleEntries.length > 0);
    this.setMobileLayout(this.isMobileLayout);
  }

  setMobileLayout(isMobile: boolean): void {
    this.isMobileLayout = isMobile;
    const layout = createScenarioResourceHudLayout(this.visibleEntries, isMobile);
    const background = this.resources_container.list.find(
      (child): child is Phaser.GameObjects.NineSlice => child instanceof Phaser.GameObjects.NineSlice
    );
    this.resources_container.setScale(layout.containerScale);

    if (background) {
      background.setSize(layout.background.width, layout.background.height);
      background.scaleX = layout.background.scaleX;
      background.scaleY = layout.background.scaleY;
    }

    for (const position of layout.entries) {
      const resource = this.resources_container.list.find(
        (child): child is Resource => child instanceof Resource && child.type === position.type
      );
      if (!resource) continue;
      resource.x = position.x;
      resource.y = position.y;
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
