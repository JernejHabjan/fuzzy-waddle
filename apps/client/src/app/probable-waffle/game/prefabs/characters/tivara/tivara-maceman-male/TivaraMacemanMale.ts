// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class TivaraMacemanMale extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "maceman_male_lvl1_idle", frame ?? 4);

		this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
		this.play("maceman_male_lvl1_idle_2");

		/* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  override name = ObjectNames.TivaraMacemanMale;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
