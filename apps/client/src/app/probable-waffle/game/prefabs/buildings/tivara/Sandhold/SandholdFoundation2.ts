
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class SandholdFoundation2 extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 160, y ?? 240);

    this.setInteractive(new Phaser.Geom.Polygon("-154 2 -143.69506876429327 -12.573094357850977 1.8734611246904365 -90.16911208748081 138.27607480024585 -15.20219592954831 153 0 123 24 105.41230515402918 31.464356968079414 80.43584022290452 44.60986482656608 60 53 5 79 -56 53 -76.65297868601124 44.60986482656608 -100.31489283128724 34.75073393270105 -120 22"), Phaser.Geom.Polygon.Contains);

    // sandhold_building
    const sandhold_building = scene.add.image(0, -80, "factions", "buildings/tivara/sandhold/foundation/foundation_2.png");
    this.add(sandhold_building);

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
