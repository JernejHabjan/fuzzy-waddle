
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FenceLeft extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 21.6000919342041, y ?? 61.27981453126563, texture || "outside", frame ?? "architecture/obstruction/fence/left.png");

		this.setInteractive(new Phaser.Geom.Polygon("-0.14241405393368467 35.29668990639772 4.871301540532258 32.993090849480936 9.07198217373346 37.32927730955959 27.63628045594521 28.11488108189245 28.042797936577585 19.71351981549005 33.056513531043535 17.951944066083094 36.30865337610253 19.71351981549005 35.7666300685927 80.01361277595888 27.77178628282267 79.87810694908141 27.500774629067752 71.61225150955647 8.800970519978542 62.53336110876679 7.445912251203964 66.32752426133561 0.12859759982122654 65.64999512694833"), Phaser.Geom.Polygon.Contains);
		this.setOrigin(0.337501427689055, 0.7659976629828391);

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
