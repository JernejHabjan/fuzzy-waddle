// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorDataFromName } from "../../../../data/actor-data";
import { ObjectNames } from "../../../../data/object-names";
/* END-USER-IMPORTS */

export default class WallBottomLeft extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 80.18960216826852, texture || "factions", frame ?? "buildings/tivara/wall/wall_bottom_left.png");

		this.setInteractive(new Phaser.Geom.Polygon("0 24 7.204722308428629 18.716250108698873 16.021705373363574 22.751140663838598 16.917483748350534 31.00733681491144 32.16126759392246 23.199461836631897 64.14151125317802 38.59182210253528 64.15270339559345 79.59313574989041 31.72413856354457 96.03157875231149 0.04277568615120586 80.63921848640811"), Phaser.Geom.Polygon.Contains);
		this.setOrigin(0.5, 0.8353083559194637);

		/* START-USER-CTR-CODE */
    setActorDataFromName(this);
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  name = ObjectNames.WallBottomLeft;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
