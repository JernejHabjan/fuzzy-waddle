// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class SkeletonSwordsman extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 52.0050654008063, texture || "skeleton_swordsman_idle", frame ?? 4);

		this.setInteractive(new Phaser.Geom.Circle(96, 103, 32), Phaser.Geom.Circle.Contains);
		this.setOrigin(0.5, 0.6388961463056025);
		this.play("skeleton_swordsman_idle_2");

		/* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  override name = ObjectNames.SkeletonSwordsman;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
