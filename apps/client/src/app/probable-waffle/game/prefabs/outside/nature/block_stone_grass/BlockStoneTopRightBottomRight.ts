// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BlockStoneTopRightBottomRight extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 48.14660195684367, texture || "outside", frame ?? "nature/block_stone_grass/top_right_bottom_right.png");

		this.setInteractive(new Phaser.Geom.Polygon("0 16 32 0 64 16 63.87692032463579 48.25256512899465 32.007514849696626 64.03752963689782 0.012200041952727503 47.373360474054735"), Phaser.Geom.Polygon.Contains);
		this.setOrigin(0.5, 0.7522906265785319);

		/* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
	}

	public z: number = 0;

	/* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
