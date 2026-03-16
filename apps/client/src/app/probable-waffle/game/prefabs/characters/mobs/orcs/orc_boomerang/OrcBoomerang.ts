// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class OrcBoomerang extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 38, y ?? 56);

		this.setInteractive(new Phaser.Geom.Circle(-1, -20, 26.756500103072945), Phaser.Geom.Circle.Contains);
		this.scaleX = 1.1;
		this.scaleY = 1.1;

		// general_warrior_idle_down
		const general_warrior_idle_down = scene.add.sprite(0, -25.077002702152576, "orc_boomerang_idle", 4);
		general_warrior_idle_down.play("orc_boomerang_idle_2");
		this.add(general_warrior_idle_down);

		/* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  override name = ObjectNames.OrcBoomerang;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
