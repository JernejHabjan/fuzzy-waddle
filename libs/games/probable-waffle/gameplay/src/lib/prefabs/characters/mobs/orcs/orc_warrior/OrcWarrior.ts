// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class OrcWarrior extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 38, y ?? 68);

		this.setInteractive(new Phaser.Geom.Circle(-1, -20, 25.142976744999586), Phaser.Geom.Circle.Contains);
		this.scaleX = 1.2;
		this.scaleY = 1.2;

		// general_warrior_idle_down
		const general_warrior_idle_down = scene.add.sprite(0, -25.077002702152576, "orc_warrior_idle", 4);
		general_warrior_idle_down.play("orc_warrior_idle_2");
		this.add(general_warrior_idle_down);

		/* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  override name = ObjectNames.OrcWarrior;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
