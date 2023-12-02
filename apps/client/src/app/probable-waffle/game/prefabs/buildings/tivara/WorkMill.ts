// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from '../../../entity/actor/ActorContainer';
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WorkMill extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96.29342343955079);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        '-63.89974877636719 -65.64818497632388 -36.35219201632184 -96.09548455321611 16.32646915639647 -69.99779920159419 16.568114391133705 -48.974663779454325 41.215928334332176 -61.781861220528036 51.60667342803349 -53.80756847419912 52.33160913224522 -20.460526080460014 62.72235422594652 -9.103200047809736 60.30590187857412 0.07931887220537703 7.385595471118592 31.25155415330933 -49.64267992687003 27.62687563225073 -59.79177978583411 7.570321149059822 -58.82519884688515 -61.781861220528036'
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_workmill_png_1
    const buildings_tivara_workmill_png_1 = scene.add.image(
      0,
      -32.29342343955079,
      'factions',
      'buildings/tivara/workmill.png'
    );
    this.add(buildings_tivara_workmill_png_1);

    /* START-USER-CTR-CODE */
    this.on('pointerdown', () => {
      buildings_tivara_workmill_png_1.setTint(0xff0000); // Tint to red
    });

    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
