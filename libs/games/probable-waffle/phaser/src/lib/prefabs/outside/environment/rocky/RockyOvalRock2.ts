
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyOvalRock2 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 33.22410352797114, y ?? 34.884605057452085, texture || "environment_1", frame ?? "rocky/Oval_rock2_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 24.88122199818084), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.519126617624549, 0.5450719540226888);

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
