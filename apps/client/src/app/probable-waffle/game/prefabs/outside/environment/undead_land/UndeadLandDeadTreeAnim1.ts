
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class UndeadLandDeadTreeAnim1 extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? -23.8314053788544, y ?? 148.0491760631506);

    this.setInteractive(new Phaser.Geom.Polygon("-12.74771091699725 -70.90219914851379 36.518638751830736 -102.61873327007686 70.77249560311884 -48.91206882423006 20.8718152518596 8.177692594583476 -19.5139048629307 8.389136155393885"), Phaser.Geom.Polygon.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;

    // undead_land_DeadTreeAnim1_Animation1-0_png
    const undead_land_DeadTreeAnim1_Animation1_0_png = scene.add.image(20.93291208890689, -43.98025974234983, "environment_1", "undead_land/DeadTreeBase1.png");
    this.add(undead_land_DeadTreeAnim1_Animation1_0_png);

    // undead_land_DeadTreeAnim1_Animation1-0_png_1
    const undead_land_DeadTreeAnim1_Animation1_0_png_1 = scene.add.sprite(20.93291208890689, -43.98025974234983, "environment_1", "undead_land/DeadTreeAnim1/DeadTreeAnim1.png");
    undead_land_DeadTreeAnim1_Animation1_0_png_1.play("undead_land/DeadTreeAnim1/DeadTreeAnim");
    this.add(undead_land_DeadTreeAnim1_Animation1_0_png_1);

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
