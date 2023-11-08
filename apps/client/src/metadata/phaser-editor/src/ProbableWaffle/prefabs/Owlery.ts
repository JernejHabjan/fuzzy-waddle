
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Owlery extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 129, y ?? 132);

		// image_1
		const image_1 = scene.add.image(0, 0, "factions", "buildings/skaduwee/owlery/owlery.png");
		this.add(image_1);

		// image_2
		const image_2 = scene.add.image(3, -54, "factions", "buildings/skaduwee/owlery/owlery-owl/owlery-owl-0.png");
		this.add(image_2);

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
