
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class UndeadLandDeadTreeAnim2 extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 19.786336332249633, y ?? 82.70128196847955);

    this.setInteractive(new Phaser.Geom.Polygon("-30.643296923372247 -20.73498592114659 -18.87438623627149 -50.754236369403586 5.812876880788821 -77.4795903041466 15.408962287022007 -46.31957437136562 35.70606912419578 -37.27968645228823 20.696443900067294 -23.29344476616849 18.82024074705123 8.60200883510457 -21.262281158291927 9.284264527110409"), Phaser.Geom.Polygon.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;

    // image_1
    const image_1 = scene.add.image(5.812876314234742, -29.479587022190486, "environment_1", "undead_land/DeadTreeBase2.png");
    this.add(image_1);

    // undead_land_DeadTreeAnim2_Animation2-0_png
    const undead_land_DeadTreeAnim2_Animation2_0_png = scene.add.sprite(5.812876314234742, -29.479587022190486, "environment_1", "undead_land/DeadTreeAnim2/Animation2-0.png");
    undead_land_DeadTreeAnim2_Animation2_0_png.play("undead_land/DeadTreeAnim2/Animation");
    this.add(undead_land_DeadTreeAnim2_Animation2_0_png);

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
