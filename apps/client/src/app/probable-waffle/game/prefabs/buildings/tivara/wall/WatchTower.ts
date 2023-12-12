
// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WatchTower extends ActorContainer {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 64, y ?? 142.47539776925427);

		this.removeInteractive();
		this.setInteractive(new Phaser.Geom.Rectangle(-64, -88, 128, 176), Phaser.Geom.Rectangle.Contains);

		// buildings_tivara_watchtower
		const buildings_tivara_watchtower = scene.add.image(0, 4.872568900448954, "factions", "buildings/tivara/watchtower.png");
		buildings_tivara_watchtower.setOrigin(0.5, 0.8372043631692212);
		this.add(buildings_tivara_watchtower);

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
