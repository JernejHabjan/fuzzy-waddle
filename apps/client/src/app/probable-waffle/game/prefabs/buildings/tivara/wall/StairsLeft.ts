// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class StairsLeft extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Po'-32.20109221451683 -32.74753993756093 -0.2743153597745689 -48.49617426052796 8.029510010517143 -46.062294410614875 32.08196970377588 -8.695080244302183 31.938800300839823 1.469947364158358 1.1573786695860733 16.073226463636885 -32.05792281158077 0.3245921406698429'45921406698429"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_stairs_left
    const buildings_tivara_wall_stairs_left = scene.add.image(
      0,
      -31.962293194621118,
      "factions",
      "buildings/tivara/wall/stairs_left.png"
    );
    buildings_tivara_wall_stairs_left.setOrigin(0.5, 0.24952659683163414);
    this.add(buildings_tivara_wall_stairs_left);

    // this (prefab fields)
    this.z = 0;

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_stairs_left.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_wall_stairs_left.clearTint();
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
