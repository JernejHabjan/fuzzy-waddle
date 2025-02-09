
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class AnkGuardFoundation2 extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 128, y ?? 182);

    this.setInteractive(new Phaser.Geom.Polygon("-10.918878067208851 -117.93840288367251 0.01286537585883707 -123.56383394844298 12.244993046258884 -122.40794614200053 13.121250682011777 -83.41448135099652 37.65646448309295 -77.71880671860269 47.73342729425127 -98.74898997667226 64.62980707219444 -87.19718016420471 63.3154206185651 -29.3641762045134 82.72689214496742 -14.869207016229751 3.0717426727876784 33.10743982471706 -81.93258041613879 -11.354115282698672 -73.17000405860979 -84.95975668594215 -66.1599429725866 -95.03671949710049 -37.24344099274094 -44.65190544130883 -11.393840738030434 -61.73892933849035"), Phaser.Geom.Polygon.Contains);

    // ankguard-building
    const ankguard_building = scene.add.image(0, -54.83180956776931, "factions", "buildings/tivara/ankguard/foundation/foundation_2.png");
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
