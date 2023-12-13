// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallBottomRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-31.902864864568688 -40.826839959506685 0.25428694321482226 -57.06001755478201 15.714456081572273 -48.866127911452566 15.869057772955848 -54.27718710987767 24.37215079905245 -58.91523785138491 32 -56 32.06942659568871 0.06510365557899433 -0.1769536357396042 16.031757944926994 -32.00590499685817 0.899961396198492"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_bottom_right
    const buildings_tivara_wall_bottom_right = scene.add.image(
      0,
      -32,
      "factions",
      "buildings/tivara/wall/wall_bottom_right.png"
    );
    this.add(buildings_tivara_wall_bottom_right);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_bottom_right.setTint(0xff0000); // Tint to red
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
