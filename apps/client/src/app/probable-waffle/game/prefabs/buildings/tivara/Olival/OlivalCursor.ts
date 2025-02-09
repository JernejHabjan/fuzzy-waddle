
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class OlivalCursor extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 16, y ?? 55);

		this.setInteractive(new Phaser.Geom.Polygon("-12.788011962835393 -30.360902541923828 0.5188883965774025 -42.99403579453091 13.657346979288771 -31.70843675553525 15.004881192900193 -10.484772891155345 13.994230532691624 5.854079448883155 -14.809313283252527 5.685637672181727 -15.819963943461094 -10.484772891155345"), Phaser.Geom.Polygon.Contains);

		// buildings_tivara_olival_floor
		const buildings_tivara_olival_floor = scene.add.image(0.008459511735509295, 4.464746540021096, "factions", "buildings/tivara/olival/olival-floor.png");
		this.add(buildings_tivara_olival_floor);

		// buildings_tivara_olival
		const buildings_tivara_olival = scene.add.image(0, -22, "factions", "buildings/tivara/olival/olival.png");
		this.add(buildings_tivara_olival);

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
