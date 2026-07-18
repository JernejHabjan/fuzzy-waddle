// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import Phaser from "phaser";
/* END-USER-IMPORTS */

export default class InfantryInnCursor extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 128);

    this.setInteractive(new Phaser.Geom.Circle(0, -35, 59.91620797027979), Phaser.Geom.Circle.Contains);

    // infantry_inn_building
    const infantry_inn_building = scene.add.image(
      -0.16910280030724323,
      -31.74029716298027,
      "factions",
      "buildings/skaduwee/infantry_inn/infantry_inn.png"
    );
    this.add(infantry_inn_building);

    // skaduwee_buildings_infantry_inn_entrance
    const skaduwee_buildings_infantry_inn_entrance = scene.add.sprite(
      24,
      -8,
      "factions",
      "buildings/skaduwee/infantry_inn/infantry_inn-entrance/infantry_inn-0.png"
    );
    skaduwee_buildings_infantry_inn_entrance.play("skaduwee-buildings-infantry-inn-entrance");
    this.add(skaduwee_buildings_infantry_inn_entrance);

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
