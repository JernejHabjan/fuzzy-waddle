// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FrostForge extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 129, y ?? 323.7847134131514);

		// buildings_skaduwee_frost_forge_frost_forge_png
		const buildings_skaduwee_frost_forge_frost_forge_png = scene.add.image(-1, -18.21845166634691, "factions", "buildings/skaduwee/frost_forge/frost_forge.png");
		buildings_skaduwee_frost_forge_frost_forge_png.setOrigin(0.5, 0.7957454759361422);
		this.add(buildings_skaduwee_frost_forge_frost_forge_png);

		// frost_forge_flame
		const frost_forge_flame = scene.add.sprite(-1, -209.5049784310576, "factions", "buildings/skaduwee/frost_forge/flame/frost_forge_flame_1.png");
		frost_forge_flame.setOrigin(0.5, 0.5151570341464229);
		frost_forge_flame.play("frost_forge_flame");
		this.add(frost_forge_flame);

		/* START-USER-CTR-CODE */

    this.on("pointerdown", () => {
      buildings_skaduwee_frost_forge_frost_forge_png.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_skaduwee_frost_forge_frost_forge_png.clearTint();
      }, 1000);
    });
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
