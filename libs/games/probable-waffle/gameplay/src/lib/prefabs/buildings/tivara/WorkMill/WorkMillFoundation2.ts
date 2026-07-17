// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WorkMillFoundation2 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-51.120777320965956 -23.977651010817908 -21.491329951998644 -39.93196882487724 5.403091505987064 -32.18272874376271 16.568114391133705 -48.974663779454325 41.215928334332176 -61.781861220528036 51.60667342803349 -53.80756847419912 52.33160913224522 -20.460526080460014 62.72235422594652 -9.103200047809736 60.30590187857412 0.07931887220537703 51.44269434084397 5.651796358149397 19.07822106089506 13.856874091094198 -5.081174486109056 -0.2740931156440638 -23.770518211149977 6.563471661809928 -58.870017402080485 -17.595923885194182"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_workmill_png_1
    const buildings_tivara_workmill_png_1 = scene.add.image(
      0,
      -32.29342343955079,
      "factions",
      "buildings/tivara/workmill/foundation/foundation_2.png"
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
