
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyOvalRock5 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 41.79610796254454, texture || "environment_1", frame ?? "rocky/Oval_rock5_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 8.904793625054316), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.5561283738295169);

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
