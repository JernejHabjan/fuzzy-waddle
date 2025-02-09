
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class OwleryFoundation1 extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 32, y ?? 176);

		this.setInteractive(new Phaser.Geom.Rectangle(-24, -64, 49.51264913222212, 78.82690030425472), Phaser.Geom.Rectangle.Contains);

		// owlery_building
		const owlery_building = scene.add.image(0, -80, "factions", "buildings/skaduwee/owlery/foundation/foundation_1.png");
		this.add(owlery_building);

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
