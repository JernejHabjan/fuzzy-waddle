// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
import ActorContainer from '../../../entity/actor/ActorContainer';
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WorkMill extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96.29342343955079);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        '-64 -32 -36.234159332489156 -63.0211994554259 15.742874893184435 -37.80157338143043 16.050431308720974 -16.887737124946376 44.038065122545206 -30.727775824090237 52.34208834203153 -23.038865435676982 52.649644757568055 10.792340273341338 63.72167571688314 21.86437123265641 56.64787815954294 37.24219200948292 8.976633751380774 63.07693091455144 -49.45908520055995 58.46358468150349 -59.91600332880197 37.24219200948292'
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_workmill_png
    const buildings_tivara_workmill_png = new ActorContainer(scene, 0, -32.29342343955079);
    this.add(buildings_tivara_workmill_png);

    // buildings_tivara_workmill_png_1
    const buildings_tivara_workmill_png_1 = scene.add.image(
      0,
      -32.29342343955079,
      'factions',
      'buildings/tivara/workmill.png'
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
