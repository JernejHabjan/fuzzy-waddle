// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallEmpty extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-32.20957019625129 -40.55233836247181 0.5100121695889683 -56.98295115224441 32.09644882578975 -40.835624789881685 32.130438937766385 0.9547527774659983 -0.16421378695907762 16.110576643894177 -32.033936870569725 0.8131095637610599"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_empty
    const buildings_tivara_wall_empty = scene.add.image(0, -32, "factions", "buildings/tivara/wall/wall_empty.png");
    this.add(buildings_tivara_wall_empty);

    // this (prefab fields)
    this.z = 0;

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_empty.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_wall_empty.clearTint();
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
