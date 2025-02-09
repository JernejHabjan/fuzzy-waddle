
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class AnkGuardFoundation1 extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 128, y ?? 182);

    this.setInteractive(new Phaser.Geom.Polygon("-83.31893505129565 -10.968612672769211 -68.96583095017587 -95.29309926684788 -30.076220676169484 -50.290633702641685 -8.409669154810032 -63.22067251377557 38.73547595408027 -41.33901510668488 38.036554937262224 -90.96240730076622 59.703106458621676 -90.96240730076622 63.197711542711914 -25.263831719869813 85.33003813686165 -10.07154366644923 -0.7885864698569804 32.98776863691006"), Phaser.Geom.Polygon.Contains);

    // ankguard-building
    const ankguard_building = scene.add.image(0, -54.83180956776931, "factions", "buildings/tivara/ankguard/foundation/foundation_1.png");
    this.add(ankguard_building);

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
