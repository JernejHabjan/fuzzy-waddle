
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HumidDinosaurSkeletonFull extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? -29.70377683400585, texture || "environment_1", frame ?? "humid/Dinosaur_skeleton_full_dark_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("34.68681132368857 138.2810560795707 84.45215071523984 98.55609217929732 140.76556107936364 82.40418378028508 193.58666692478204 85.45995023415226 213.23087984249963 129.9868328476455 198.38858563800193 168.40218255340434 179.61744884996062 167.9656444885662 194.02320498962024 135.2252896257035 182.67321530382782 117.3272289673386 171.7597636828736 114.2714625134714 166.52130690481556 162.29064964567 150.8059365706415 157.05219286761198 135.96364236614374 107.28685347606071 111.51751073520632 149.19450770052492"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.44646962174216465);

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
