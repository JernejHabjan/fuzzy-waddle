
// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FenceTop extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 48.19767496628859, texture || "outside", frame ?? "architecture/obstruction/fence/top.png");

		this.setInteractive(new Phaser.Geom.Polygon("-0.08228049345267863 41.629732112627394 27.372465006994624 28.35161883422925 27.971477636095294 19.46626483590267 35.459135499853645 19.26659395953578 36.4574898816881 28.451454272412693 64.1824189574486 41.733423138690846 64.1824189574486 59.84567177298093 36.55732531987154 46.52166858361619 35.85847725258743 50.814592425504316 27.572135883361515 50.41525067277053 27.072958692444292 46.62150402179963 0.05526838739454476 60.00884518410066"), Phaser.Geom.Polygon.Contains);
		this.setOrigin(0.5, 0.6024709370786073);

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
