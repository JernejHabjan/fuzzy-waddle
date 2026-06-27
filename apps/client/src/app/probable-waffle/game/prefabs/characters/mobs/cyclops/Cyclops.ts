// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class Cyclops extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 64.18250450135464, y ?? 116.07593461438849);

		this.setInteractive(new Phaser.Geom.Circle(1, -51, 61.63986190864388), Phaser.Geom.Circle.Contains);

		// general_warrior_idle_down
		const general_warrior_idle_down = scene.add.sprite(-0.1825045013546429, -52.15085526868536, "cyclops_idle", 4);
		general_warrior_idle_down.scaleX = 2;
		general_warrior_idle_down.scaleY = 2;
		general_warrior_idle_down.play("cyclops_idle_2");
		this.add(general_warrior_idle_down);

		/* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  override name = ObjectNames.Cyclops;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
