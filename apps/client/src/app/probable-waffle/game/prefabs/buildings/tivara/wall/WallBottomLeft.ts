
// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallBottomLeft extends ActorContainer {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 32, y ?? 79.97895767255348);

		this.removeInteractive();
		this.setInteractive(new Phaser.Geom.Rectangle(-32, -48, 64, 96), Phaser.Geom.Rectangle.Contains);

		// buildings_tivara_wall_bottom_left
		const buildings_tivara_wall_bottom_left = scene.add.image(0, -31.978960919049555, "factions", "buildings/tivara/wall/wall_bottom_left.png");
		this.add(buildings_tivara_wall_bottom_left);

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
