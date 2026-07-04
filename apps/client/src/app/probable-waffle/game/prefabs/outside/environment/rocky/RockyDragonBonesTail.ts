
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyDragonBonesTail extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 38.22247298765859, y ?? 8.271903232641357, texture || "environment_1", frame ?? "rocky/Dragon_bones_tail_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("23.805684982451027 39.63630565842073 56.714191824671644 29.839116598523 96.40536801605222 34.61210614052445 105.44892714826551 59.73310373000583 94.64689818478851 77.06659206674797 36.366183777191736 98.41944001780715 37.371023680770975 82.5932115364339 88.11543881152335 53.95527428442512 69.0234806435175 46.670184983475515 33.85408401824358 52.44801442905624"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5486130702160827, 0.4396242440050106);

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
