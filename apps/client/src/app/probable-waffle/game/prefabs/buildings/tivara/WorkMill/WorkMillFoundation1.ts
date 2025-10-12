// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WorkMillFoundation1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-43.58652410760945 -28.5288412644298 -6.248941565650952 -39.730116027017345 46 -7 43 15 -11.049487892474183 10.408923386469795 -53.72101079756962 -12.527020175019004"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_workmill_png_1
    const buildings_tivara_workmill_png_1 = scene.add.image(
      0,
      -32.29342343955079,
      "factions",
      "buildings/tivara/workmill/foundation/foundation_1.png"
    );
    this.add(buildings_tivara_workmill_png_1);

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
