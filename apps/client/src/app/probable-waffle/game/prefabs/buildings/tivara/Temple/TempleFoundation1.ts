// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class TempleFoundation1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 96, y ?? 132);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-92.85872555160927 2.0843003546512477 1.717588417333971 -49.52617879048964 89.09801153792648 0.4054915641346497 87.84971977906085 12.8884091527907 1.0934425379011685 55.95447483365416 -89.73799615444524 12.69478030500892"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_temple
    const buildings_tivara_temple = scene.add.image(
      -0.30766778687379315,
      -36.666560409786456,
      "factions",
      "buildings/tivara/temple/foundation/foundation_1.png"
    );
    this.add(buildings_tivara_temple);

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
