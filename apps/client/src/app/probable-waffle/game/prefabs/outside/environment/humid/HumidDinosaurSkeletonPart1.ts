
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidDinosaurSkeletonPart1 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 11.401959294592451, texture || "environment_1", frame ?? "humid/Dinosaur_skeleton_part1_dark_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("28.557893095683994 51.1695793949684 87.49053184883684 22.79460518048743 99.71359766430555 37.200361320147 71.34706482800262 63.09040776603441 66.10016667176654 94.8233858787853 49.51172020791614 93.51377168427081 31.613659549551187 76.92532522042038"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.4328278069890035);

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
