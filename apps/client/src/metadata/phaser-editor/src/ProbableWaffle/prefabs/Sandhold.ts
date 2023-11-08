
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Sandhold extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 624, y ?? 288);

		// sprite_1
		const sprite_1 = scene.add.image(-466, -124, "factions", "buildings/tivara/sandhold/sandhold.png");
		this.add(sprite_1);

		// image_1
		const image_1 = scene.add.image(-466, -236, "factions", "buildings/tivara/sandhold/sandhold-crystal.png");
		this.add(image_1);

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
