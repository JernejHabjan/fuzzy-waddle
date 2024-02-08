
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FenceBottomRight extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 40, texture || "outside", frame ?? "architecture/obstruction/fence/bottom_right.png");

		this.setInteractive(new Phaser.Geom.Polygon("35.51841400250784 47.509787042445325 36.8834080722049 54.619053365930625 64.05676911372424 40.431408312428154 63.7970530984057 59.50978711925356 36.48121878165367 72.87079303505618 36.67915937526416 80 27.67285174151783 80 27.778129966620895 47.6911243725515"), Phaser.Geom.Polygon.Contains);

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
