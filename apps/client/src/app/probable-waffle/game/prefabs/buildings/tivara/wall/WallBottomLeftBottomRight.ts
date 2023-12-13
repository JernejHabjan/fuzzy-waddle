// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallBottomLeftBottomRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-32.01055157929761 -57.38220982235352 -24.216581207950576 -61.90731207340611 -16.167002828578305 -59.53123170841068 -15.973037084497044 -49.68747019628675 -0.06784606983375951 -56.52476267515115 15.788853508809211 -49.15406440006329 15.837344944829525 -55.50644251872454 23.838431888181482 -60.11312894065446 32 -56 32.07071672343295 0.9676942608778347 -0.37322795190351243 16.102627215094074 -32.06460690023474 1.6366415737713709"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_bottom_left_bottom_right
    const buildings_tivara_wall_bottom_left_bottom_right = scene.add.image(
      0,
      -48.927180044278884,
      "factions",
      "buildings/tivara/wall/wall_bottom_left_bottom_right.png"
    );
    buildings_tivara_wall_bottom_left_bottom_right.setOrigin(0.5, 0.3236752078720949);
    this.add(buildings_tivara_wall_bottom_left_bottom_right);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_bottom_left_bottom_right.setTint(0xff0000); // Tint to red
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
