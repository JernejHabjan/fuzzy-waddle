
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidMushroom4 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 34.13015980016747, y ?? 44.97293081028834, texture || "environment_1", frame ?? "humid/mushroom4_dark_shadow1.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 18.244635742523187), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5332837468776167, 0.7027020439107553);

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
