// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../../../data/object-names";
/* END-USER-IMPORTS */

export default class WallBottomRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 80.10288150619456,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_bottom_right.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.08773680073041845 40.12188671501689 32.49020235140491 23.549630711539358 47.92931264524296 31.056721037900978 48.21259907265283 25.815922130818336 55.86133261271939 21.28333929226038 63.934995793900754 25.249349275998597 63.943493321894906 80.0709025042004 31.790483050169087 96 -0.07923927273626674 80.63747535902016"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8344050156895267);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.WallBottomRight;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
