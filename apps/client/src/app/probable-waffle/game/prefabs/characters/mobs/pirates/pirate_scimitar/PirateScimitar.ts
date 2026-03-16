// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class PirateScimitar extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 32, y ?? 57.077002702152576);

		this.setInteractive(new Phaser.Geom.Circle(0, -25.354877574887297, 32), Phaser.Geom.Circle.Contains);

		// general_warrior_idle_down
		const general_warrior_idle_down = scene.add.sprite(0, -25.077002702152576, "pirate_scimitar_idle", 4);
		general_warrior_idle_down.play("pirate_scimitar_idle_2");
		this.add(general_warrior_idle_down);

		/* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  override name = ObjectNames.PirateScimitar;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
