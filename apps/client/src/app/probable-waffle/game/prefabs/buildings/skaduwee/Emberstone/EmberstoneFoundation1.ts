// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class EmberstoneFoundation1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 16, y ?? 55);

    this.setInteractive(
      new Phaser.Geom.Rectangle(-15.99154048826449, -0.5352534599789038, 32, 10),
      Phaser.Geom.Rectangle.Contains
    );

    // buildings_skaduwee_emberstone_floor
    const buildings_skaduwee_emberstone_floor = scene.add.image(
      0.008459511735509295,
      4.464746540021096,
      "factions",
      "buildings/tivara/olival/olival-floor.png"
    );
    this.add(buildings_skaduwee_emberstone_floor);

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
