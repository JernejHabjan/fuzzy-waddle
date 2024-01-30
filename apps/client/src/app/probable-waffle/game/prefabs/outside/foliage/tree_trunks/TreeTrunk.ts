// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class TreeTrunk extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 16, texture || "outside", frame ?? "foliage/tree_trunks/tree_trunk.png");

		this.setInteractive(new Phaser.Geom.Rectangle(24, 6, 16, 16), Phaser.Geom.Rectangle.Contains);

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
