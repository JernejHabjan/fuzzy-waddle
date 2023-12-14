// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class StairsRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Po'-32.06247521360296 -8.772903844723082 -7.654525423037683 -44.809169337397286 -0.28608775041420387 -48.37825633507428 32.06595890594825 -32.83545811938413 32.06595890594825 0.5527750846910138 0.174439604124764 16.32583697765064 -32.1776070522377 1.4738297937689424'38297937689424"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_stairs_right
    const buildings_tivara_wall_stairs_right = scene.add.image(
      0,
      -31.962293194621118,
      "factions",
      "buildings/tivara/wall/stairs_right.png"
    );
    buildings_tivara_wall_stairs_right.setOrigin(0.5, 0.24952659683163414);
    this.add(buildings_tivara_wall_stairs_right);

    // this (prefab fields)
    this.z = 0;

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_stairs_right.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_wall_stairs_right.clearTint();
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
