// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class FrostForgeFoundation2 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 129, y ?? 324);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-68.71281854408106 -92.92778060517628 -43.905596581521934 -128.89825245088701 -2.973680343299378 -142.54222453029453 40.4389580911791 -130.138613549015 86.33231872191348 -65.63983644636124 92.53412421255325 27.38724591323546 6.9492084417242665 47.23302348328275 -93.52004050664019 11.262551637572017"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_skaduwee_frost_forge_frost_forge_png
    const buildings_skaduwee_frost_forge_frost_forge_png = scene.add.image(
      -1,
      -18.21845166634691,
      "factions",
      "buildings/skaduwee/frost_forge/foundation/foundation_2.png"
    );
    buildings_skaduwee_frost_forge_frost_forge_png.setOrigin(0.5, 0.7957454759361422);
    this.add(buildings_skaduwee_frost_forge_frost_forge_png);

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
