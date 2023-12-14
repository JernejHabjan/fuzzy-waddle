// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallBottomLeft extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 79.97895767255348);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Po'-31.974340311316016 -57.291677833627986 -23.383032665122595 -62.03337344865734 -15.98350295152499 -57.56435055232612 -15.83697761066167 -49.139143452685275 0.8182564134912482 -57.14593295929551 32.07680885164362 -41.00698703477107 32.14643107920537 1.2978925329840507 0.1985989137153652 16.138906765888976 -32.08910380672666 1.2978925329840507'78925329840507"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_bottom_left
    const buildings_tivara_wall_bottom_left = scene.add.image(
      0,
      -47.96466252248314,
      "factions",
      "buildings/tivara/wall/wall_bottom_left.png"
    );
    buildings_tivara_wall_bottom_left.setOrigin(0.5, 0.3334822468676007);
    this.add(buildings_tivara_wall_bottom_left);

    // this (prefab fields)
    this.z = 0;

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_bottom_left.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_wall_bottom_left.clearTint();
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
