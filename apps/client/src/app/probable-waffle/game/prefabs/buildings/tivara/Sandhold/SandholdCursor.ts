
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class SandholdCursor extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 160, y ?? 240);

    this.setInteractive(new Phaser.Geom.Polygon("-154 2 -1 -219 153 0 123 24 119 47 82 64 60 53 5 79 -56 53 -81 58 -119 42 -120 22"), Phaser.Geom.Polygon.Contains);

    // sandhold_building
    const sandhold_building = scene.add.image(0, -80, "factions", "buildings/tivara/sandhold/sandhold.png");
    this.add(sandhold_building);

    // hover_crystal
    const hover_crystal = scene.add.image(0, -192, "factions", "buildings/tivara/sandhold/sandhold-crystal.png");
    this.add(hover_crystal);

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
