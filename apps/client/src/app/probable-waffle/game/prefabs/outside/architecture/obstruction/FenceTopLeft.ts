
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FenceTopLeft extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 48.40136497352084, texture || "outside", frame ?? "architecture/obstruction/fence/top_left.png");

		this.setInteractive(new Phaser.Geom.Polygon("0.12056985325718017 42.06854323339289 27.558300666118054 28.056865912563776 27.71189132168657 19.07181256180572 36.14369498519067 19.099094107456196 36.5202433315175 51.10570354523683 28.09586796060785 51.1722595756251 27.327914682765282 46.48774458078543 0.3716020841417311 59.64079939531166"), Phaser.Geom.Polygon.Contains);
		this.setOrigin(0.5, 0.6050170621690105);

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
