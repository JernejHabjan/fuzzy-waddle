// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class InfantryInnFoundation1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 128);

    this.setInteractive(
      new Phaser.Geom.Ellipse(0, 0, 122.35893225371242, 61.09258617525286),
      Phaser.Geom.Ellipse.Contains
    );

    // infantry_inn_building
    const infantry_inn_building = scene.add.image(
      -0.16910280030724323,
      -31.74029716298027,
      "factions",
      "buildings/skaduwee/infantry_inn/foundation/foundation_1.png"
    );
    this.add(infantry_inn_building);

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
