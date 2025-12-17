// You can write more code here

/* START OF COMPILED CODE */

import TreeBird from "../../../../animals/tree-bird/TreeBird";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class Tree10 extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 91, y ?? 166);

		// foliage_trees_resources_tree10_png
		const foliage_trees_resources_tree10_png = scene.add.image(1, -3, "outside", "foliage/trees/resources/tree10.png");
		foliage_trees_resources_tree10_png.setInteractive(new Phaser.Geom.Polygon("4.193840323421412 29.447687344756716 47.028453916909534 15.89999560356047 87.87075990139822 30.443841149256443 84.88229848789904 47.77691734755164 63.365376310705 73.27845474274457 53.20460750480782 76.66537767804363 51.411530656708315 86.62691572304087 37.26614663281224 86.02922344034103 35.67230054561268 64.31307050224704 3.596148040721573 42.19845604235318"), Phaser.Geom.Polygon.Contains);
		foliage_trees_resources_tree10_png.scaleX = 2;
		foliage_trees_resources_tree10_png.scaleY = 2;
		foliage_trees_resources_tree10_png.setOrigin(0.5, 0.8833026541239049);
		this.add(foliage_trees_resources_tree10_png);

		// treeBird
		const treeBird = new TreeBird(scene, 43, -21);
		this.add(treeBird);

		this.treeBird = treeBird;

		/* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
	}

	private treeBird: TreeBird;

	/* START-USER-CODE */
  override name = ObjectNames.Tree10;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
