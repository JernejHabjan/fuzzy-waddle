
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class UndeadLandDeadTreeAnim3 extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 6.5782338961747175, y ?? 64.08844203973986);

    this.setInteractive(new Phaser.Geom.Polygon("-15.032378539869867 -42.71146599378769 13.144070206038379 -26.431740051707372 43.61637773865024 -42.607108776210254 13.144070206038379 7.588712878537393 -13.467020276208302 5.29285409183376"), Phaser.Geom.Polygon.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;

    // image_1
    const image_1 = scene.add.image(13.295745672306728, -15.614771080267204, "environment_1", "undead_land/DeadTreeBase3.png");
    this.add(image_1);

    // undead_land_DeadTreeAnim3_Animation3-0_png
    const undead_land_DeadTreeAnim3_Animation3_0_png = scene.add.sprite(13.295745672306728, -15.614771080267204, "environment_1", "undead_land/DeadTreeAnim3/Animation3-0.png");
    undead_land_DeadTreeAnim3_Animation3_0_png.play("undead_land/DeadTreeAnim3/Animation");
    this.add(undead_land_DeadTreeAnim3_Animation3_0_png);

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
