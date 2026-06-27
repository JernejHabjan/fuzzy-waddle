// You can write more code here

/* START OF COMPILED CODE */

import TreeBird from "../../../../animals/tree-bird/TreeBird";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
import { hasMultiplayerCommandRelay } from "../../../../../data/scene-data";
/* END-USER-IMPORTS */

export default class Tree11 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 93, y ?? 169);

    // foliage_trees_resources_tree11_png
    const foliage_trees_resources_tree11_png = scene.add.image(
      0,
      -169,
      "outside",
      "foliage/trees/resources/tree11.png"
    );
    foliage_trees_resources_tree11_png.setInteractive(
      new Phaser.Geom.Polygon(
        "3.784376857318719 27.45468445486062 20.869663472802703 17.062602905236346 48.523168613328316 11.073945741046074 91.1483166643296 21.289890315252997 88.15398808223446 46.12520384910084 57.33001738419635 60.04002490707233 59.795935040039396 89.80717375260627 35.66516940786099 90.5117216542757 30.733334096174897 84.52306449008546 40.24473076871237 63.73890139083691 29.32423829283601 46.301340824518206 7.307116365665934 36.43767020114601"
      ),
      Phaser.Geom.Polygon.Contains
    );
    foliage_trees_resources_tree11_png.scaleX = 2;
    foliage_trees_resources_tree11_png.scaleY = 2;
    foliage_trees_resources_tree11_png.setOrigin(0.5, 0);
    this.add(foliage_trees_resources_tree11_png);

    // treeBird
    const treeBird = new TreeBird(scene, -53, -35);
    this.add(treeBird);

    this.treeBird = treeBird;

    /* START-USER-CTR-CODE */
    this.handleBirdVisibility();
    /* END-USER-CTR-CODE */
  }

  private treeBird: TreeBird;

  /* START-USER-CODE */
  override name = ObjectNames.Tree11;

  private handleBirdVisibility() {
    if (hasMultiplayerCommandRelay(this.scene)) {
      this.treeBird.setVisible(false);
      return;
    }
    const randomNum = Phaser.Math.Between(1, 5);
    if (randomNum !== 1) {
      this.treeBird.setVisible(false);
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
