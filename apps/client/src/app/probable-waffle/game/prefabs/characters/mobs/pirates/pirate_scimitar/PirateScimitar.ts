// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class PirateScimitar extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 96, y ?? 120, texture || "pirate_scimitar_idle", frame ?? 4);

		this.setInteractive(new Phaser.Geom.Circle(95, 104, 32), Phaser.Geom.Circle.Contains);
		this.setOrigin(0.5, 0.6295196813175922);
		this.play("pirate_scimitar_idle_2");

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
