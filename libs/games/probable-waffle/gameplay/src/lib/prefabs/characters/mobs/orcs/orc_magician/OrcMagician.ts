// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class OrcMagician extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 35, y ?? 63.226132480050694);

		this.setInteractive(new Phaser.Geom.Circle(0, -23, 27.367177476412422), Phaser.Geom.Circle.Contains);
		this.scaleX = 1.1;
		this.scaleY = 1.1;

		// general_warrior_idle_down
		const general_warrior_idle_down = scene.add.sprite(0, -25.660119880241602, "orc_magician_idle", 4);
		general_warrior_idle_down.play("orc_magician_idle_2");
		this.add(general_warrior_idle_down);

		/* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  override name = ObjectNames.OrcMagician;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
