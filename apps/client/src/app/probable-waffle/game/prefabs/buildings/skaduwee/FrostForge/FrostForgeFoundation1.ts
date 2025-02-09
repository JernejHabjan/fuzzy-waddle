
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FrostForgeFoundation1 extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 129, y ?? 324);

		this.setInteractive(new Phaser.Geom.Ellipse(0, 7, 219.83793962711323, 103.31459971915817), Phaser.Geom.Ellipse.Contains);

		// buildings_skaduwee_frost_forge_frost_forge_png
		const buildings_skaduwee_frost_forge_frost_forge_png = scene.add.image(-1, -18.21845166634691, "factions", "buildings/skaduwee/frost_forge/foundation/foundation_1.png");
		buildings_skaduwee_frost_forge_frost_forge_png.setOrigin(0.5, 0.7957454759361422);
		this.add(buildings_skaduwee_frost_forge_frost_forge_png);

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
