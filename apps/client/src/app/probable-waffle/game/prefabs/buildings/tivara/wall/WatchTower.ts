// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WatchTower extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 142.47539776925427);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-64.23418551822556 -103.52810437148997 -0.749322531581889 -135.59443822698856 64.03114990376878 -103.85200673366671 64.03114990376878 -76.32030594864268 58.84871210894073 -58.181773666744505 58.174081611723054 4.226407461799909 -0.2018238858371788 33.523678385669086 -56.61000223179427 4.882316512334285 -56.09045727460826 -57.196316728098566 -64.18000223119901 -77.31086094448636"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_watchtower
    const buildings_tivara_watchtower = scene.add.image(
      0,
      4.872568900448954,
      "factions",
      "buildings/tivara/watchtower.png"
    );
    buildings_tivara_watchtower.setOrigin(0.5, 0.8372043631692212);
    this.add(buildings_tivara_watchtower);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_watchtower.setTint(0xff0000); // Tint to red
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
