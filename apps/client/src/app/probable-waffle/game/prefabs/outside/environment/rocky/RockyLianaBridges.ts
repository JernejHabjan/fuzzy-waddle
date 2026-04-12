
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyLianaBridges extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 30.11499791490209, y ?? 22.552471851178197, texture || "environment_1", frame ?? "rocky/Liana_bridges_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("28.95927792385021 50.40310797684054 38.61991360528819 36.02996708494503 101.29623290437351 69.2531288186707 96.58372769391596 87.39627387893225 73.492452162674 93.9937811735728"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.4852734212101726, 0.5511911863373297);

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
