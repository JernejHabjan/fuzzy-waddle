// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class OrcMagician extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 35, y ?? 63, texture || "orc_magician_idle", frame ?? 4);

		this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
		this.scaleX = 1.1;
		this.scaleY = 1.1;
		this.setOrigin(0.5, 0.899286430676403);
		this.play("orc_magician_idle_2");

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
