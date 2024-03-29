// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BushUpwardsLarge extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "foliage/bushes/bush_upwards_large.png");

		this.setInteractive(new Phaser.Geom.Circle(34, 35, 24), Phaser.Geom.Circle.Contains);
		this.setOrigin(0.5, 0.75);

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
