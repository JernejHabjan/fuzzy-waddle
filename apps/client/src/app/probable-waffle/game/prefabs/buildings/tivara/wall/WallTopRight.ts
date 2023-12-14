// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-31.851349712360076 -40.08107931895205 -7.328023954941752 -52.83320871280958 -7.328023954941752 -68.6682704875997 -0.0410928727374511 -73.0124024789138 8.647171109890756 -68.6682704875997 9.487970850145096 -60.68067295518344 16.21436877217984 -65.16493823653994 25.323032624935216 -60.54053966514105 25.603299205019994 -52.973342002851965 31.909297256927566 -49.6101430418346 32.04943054696996 0.9779746634683448 -0.46149274286462116 16.11236998804651 -32.13161629244485 1.398374533595515"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_top_right
    const buildings_tivara_wall_top_right = scene.add.image(
      0,
      -47.96466252248314,
      "factions",
      "buildings/tivara/wall/wall_top_right.png"
    );
    buildings_tivara_wall_top_right.setOrigin(0.5, 0.3334822468676007);
    this.add(buildings_tivara_wall_top_right);

    // this (prefab fields)
    this.z = 0;

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_top_right.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_wall_top_right.clearTint();
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
