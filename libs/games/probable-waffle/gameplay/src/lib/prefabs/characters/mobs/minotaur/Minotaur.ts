// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class Minotaur extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 64.07536195898811, y ?? 117.4242644869538);

		this.setInteractive(new Phaser.Geom.Circle(-1, -57, 70.06050123719255), Phaser.Geom.Circle.Contains);

		// general_warrior_idle_down
		const general_warrior_idle_down = scene.add.sprite(-0.07536195898811116, -53.8115935885163, "minotaur_idle", 4);
		general_warrior_idle_down.scaleX = 2;
		general_warrior_idle_down.scaleY = 2;
		general_warrior_idle_down.play("minotaur_idle_2");
		this.add(general_warrior_idle_down);

		/* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  override name = ObjectNames.Minotaur;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
