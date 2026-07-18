// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class OwleryFoundation2 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 176);

    this.setInteractive(new Phaser.Geom.Rectangle(-32, -176, 64, 192), Phaser.Geom.Rectangle.Contains);

    // owlery_building
    const owlery_building = scene.add.image(
      0,
      -80,
      "factions",
      "buildings/skaduwee/owlery/foundation/foundation_2.png"
    );
    this.add(owlery_building);

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
