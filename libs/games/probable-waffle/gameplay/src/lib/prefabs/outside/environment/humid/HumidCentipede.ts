
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidCentipede extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 22.64689561644886, y ?? -8.11862630130679, texture || "environment_1", frame ?? "humid/centipede_dark_shadow2.png");

    this.setInteractive(new Phaser.Geom.Polygon("42.01663236196268 99.40911230686615 105.02701737404433 68.3961884337322 179.8518495758913 104.8240672688419 219.23334020844234 92.02508281326283 205.94208711995637 132.88337934453452 142.9317021078747 144.20555790139295 72.53728760218976 180.63343673650266 43.98570689359022 156.02000509115825"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.46346443600175335, 0.5307866160105204);

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
