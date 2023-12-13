// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopRightBottomRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-31.930815678498476 -58.63399564111439 -22.230525281304878 -62.43803109099423 -15.002857926533178 -57.30258323365645 -15.19305969902717 -50.26511765137874 -8.345795889243455 -52.54753892130664 -7.96539234425547 -68.71468958329598 -0.16711967200179245 -72.8991285781638 8.201758317733862 -68.144084265814 8.365960782040858 -61.25602280220306 15.46467591766617 -64.04895990474417 32 -56 31.97943800365526 0.4566710480282268 0.18887184018790037 16.109893981309114 -31.924441187883197 1.4249116418394152"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_top_right_bottom_right
    const buildings_tivara_wall_top_right_bottom_right = scene.add.image(
      0,
      -47.96466252248314,
      "factions",
      "buildings/tivara/wall/wall_top_right_bottom_right.png"
    );
    buildings_tivara_wall_top_right_bottom_right.setOrigin(0.5, 0.3334822468676007);
    this.add(buildings_tivara_wall_top_right_bottom_right);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_top_right_bottom_right.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_wall_top_right_bottom_right.clearTint();
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
