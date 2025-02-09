
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class TempleCursor extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 96, y ?? 132);

		this.setInteractive(new Phaser.Geom.Polygon("-87.4233523303501 -76.75060092556245 -16.50738820893966 -110.3423734041253 -8.36392821413655 -103.21684590867258 0.11884261378335736 -107.28857590607413 10.298167607287255 -101.52029174308859 19.459560101440744 -108.98513007165812 87.32172672479999 -74.71473592686168 87.66103755791679 10.791594018571004 0.45815344690015536 53.544758991287324 -89.11990649593407 9.095039852987014"), Phaser.Geom.Polygon.Contains);

		// buildings_tivara_temple
		const buildings_tivara_temple = scene.add.image(-0.30766778687379315, -36.666560409786456, "factions", "buildings/tivara/temple/temple.png");
		this.add(buildings_tivara_temple);

		// buildings_tivara_temple_temple_olival
		const buildings_tivara_temple_temple_olival = scene.add.image(-2, -13, "factions", "buildings/tivara/temple/temple-olival.png");
		this.add(buildings_tivara_temple_temple_olival);

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
