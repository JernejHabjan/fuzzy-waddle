// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class BridgeStone extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 160, y ?? 112);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "27.479304206049022 -65.1928965620433 60.915991860768884 -65.1928965620433 117.9550472717616 -40.27928615264419 -70.86389477842118 61.34201946464171 -131.18105682222958 33.150302422426904 -83.32069998312075 -12.0875691104294"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // outside_architecture_river_bridge_stone
    const outside_architecture_river_bridge_stone = scene.add.image(
      0,
      -17,
      "outside",
      "architecture/river/bridge_stone.png"
    );
    outside_architecture_river_bridge_stone.setOrigin(0.5, 0.4947916666666667);
    this.add(outside_architecture_river_bridge_stone);

    // this (prefab fields)
    this.z = 0;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
