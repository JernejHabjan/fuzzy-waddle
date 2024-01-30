// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class DoorsRight extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "architecture/blocks/doors_right.png");

		this.setInteractive(new Phaser.Geom.Polygon("0 16 32 0 64 16 64.11143276305131 48.33617198576798 31.975650332859217 64 -0.03311481410391082 47.32002073702097"), Phaser.Geom.Polygon.Contains);
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
