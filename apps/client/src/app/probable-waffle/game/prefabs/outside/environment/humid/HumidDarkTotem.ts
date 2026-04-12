
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidDarkTotem extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 30.57116813066719, texture || "environment_1", frame ?? "humid/Dark_totem_dark_shadow1.png");

    this.setInteractive(new Phaser.Geom.Polygon("69.19959754386383 159.0451941050751 94.10719381859951 63.417815550286235 131.0238097257971 60.30436601594428 168.38520413790064 99.00009594276581 164.82697609865266 132.8032623156214 183.50767330470444 190.1796894484947 96.7758648480355 195.07225300246066"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.6819186255104187);

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
