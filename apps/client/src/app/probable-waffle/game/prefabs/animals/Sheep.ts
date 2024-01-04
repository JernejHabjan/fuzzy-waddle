
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Sheep extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 49.42203448546586, texture || "animals", frame ?? "sheep/sheep_down.png");

		this.setInteractive(new Phaser.Geom.Circle(29, 39, 17.805288050449516), Phaser.Geom.Circle.Contains);
		this.setOrigin(0.5, 0.772219288835404);
		this.play("sheep_idle_down");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	// Write your code here.

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
