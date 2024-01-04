// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class Olival extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 15.99154048826449, y ?? 54.535253459978904);

		this.setInteractive(new Phaser.Geom.Polygon("-12.788011962835393 -30.360902541923828 0.5188883965774025 -42.99403579453091 13.657346979288771 -31.70843675553525 15.004881192900193 -10.484772891155345 13.994230532691624 5.854079448883155 -14.809313283252527 5.685637672181727 -15.819963943461094 -10.484772891155345"), Phaser.Geom.Polygon.Contains);

		// buildings_tivara_olival_floor
		const buildings_tivara_olival_floor = scene.add.image(0.008459511735509295, 4.464746540021096, "factions", "buildings/tivara/olival/olival-floor.png");
		this.add(buildings_tivara_olival_floor);

		// buildings_tivara_olival
		const buildings_tivara_olival = scene.add.image(0, -22, "factions", "buildings/tivara/olival/olival.png");
		this.add(buildings_tivara_olival);

		/* START-USER-CTR-CODE */
    this.bounce(buildings_tivara_olival);

    this.on("pointerdown", () => {
      buildings_tivara_olival.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_olival.clearTint();
      }, 1000);
      this.tintTilemapAroundTransform(this.scene, { x: this.x, y: this.y }, 0x8f788f, 100);
    });
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  private bounce = (image: Phaser.GameObjects.Image) => {
    // bounce the sprite up and down forever with a 2 seconds duration
    this.scene.tweens.add({
      targets: image,
      y: "-=4", // move up by 4
      duration: 1000, // takes 1000ms
      ease: "Sine.InOut",
      yoyo: true, // reverse the animation after it completes
      loop: -1 // loop indefinitely
    });
  };

  private tintTilemapAroundTransform = (
    scene: Phaser.Scene,
    transform: Vector2Simple,
    tint: number,
    radius: number
  ) => {
    const tilemapLayer = scene.children.getFirst("type", "TilemapLayer") as Phaser.Tilemaps.TilemapLayer | null;
    if (!tilemapLayer) return;
    const tiles = tilemapLayer.getTilesWithinShape(new Phaser.Geom.Circle(transform.x, transform.y, radius));
    // tint tiles to red
    tiles.forEach((tile) => {
      tile.tint = tint;
    });
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
