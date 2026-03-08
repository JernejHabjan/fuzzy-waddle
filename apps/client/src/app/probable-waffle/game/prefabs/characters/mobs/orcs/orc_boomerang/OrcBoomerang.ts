// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class OrcBoomerang extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 36, y ?? 59, texture || "orc_boomerang_idle", frame ?? 4);

		this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
		this.scaleX = 1.1;
		this.scaleY = 1.1;
		this.setOrigin(0.5, 0.6393913415260354);
		this.play("orc_boomerang_idle_2");

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
