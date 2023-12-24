// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FrostForge extends ActorContainer {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 128, y ?? 320.1111944720763);

		this.removeInteractive();
		this.setInteractive(new Phaser.Geom.Polygon("-128.16910280030726 -223.85148005244537 -0.16910280030725744 -319.85148005244537 127.83089719969274 -223.85148005244537 127.83089719969274 64.14851994755463 -128.16910280030726 64.14851994755463"), Phaser.Geom.Polygon.Contains);

		// frost_forge
		const frost_forge = scene.add.image(-0.16910280030724323, -127.85149163505658, "factions", "buildings/skaduwee/frost_forge/frost_forge.png");
		this.add(frost_forge);

		// this (prefab fields)
		this.z = 0;

		/* START-USER-CTR-CODE */

    this.on("pointerdown", () => {
      frost_forge.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        frost_forge.clearTint();
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
