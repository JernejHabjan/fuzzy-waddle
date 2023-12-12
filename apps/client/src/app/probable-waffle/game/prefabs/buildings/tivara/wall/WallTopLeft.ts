// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopLeft extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-31.768330956523076 -49.01579480523985 -24.39703591212195 -52.56981205879039 -24.26540564347193 -58.88806495399136 -16.499219793120744 -63.7583848940421 -8.601403674119535 -60.467628177791596 -8.601403674119535 -67.04914161029261 -0.01794012404728207 -71.96470344189409 8.538027338204024 -67.75253484509344 8.538027338204024 -53.141575024941204 31.968215157907608 -41.031590309139354 31.915173039083946 0.758192548197556 0.06064802577908068 16.027303711599885 -32.057137524825826 0.758192548197556"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_top_left
    const buildings_tivara_wall_top_left = scene.add.image(
      0,
      -32,
      "factions",
      "buildings/tivara/wall/wall_top_left.png"
    );
    this.add(buildings_tivara_wall_top_left);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_top_left.setTint(0xff0000); // Tint to red
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
