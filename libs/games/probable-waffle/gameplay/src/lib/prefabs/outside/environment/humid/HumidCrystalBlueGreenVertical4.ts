
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidCrystalBlueGreenVertical4 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 35.07760735073984, texture || "environment_1", frame ?? "humid/crystal_blue-green_vertical4.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 9.767217370912658), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.34617522971062);

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
