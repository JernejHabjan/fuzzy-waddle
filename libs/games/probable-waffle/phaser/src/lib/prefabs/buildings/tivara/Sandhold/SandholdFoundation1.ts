// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class SandholdFoundation1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 160, y ?? 240);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-154 2 -147.81791191850314 -16.123533594708306 0.6568260741728125 -88.18641245876012 143.2760167989964 -18.96642285172817 153 0 123 24 103.35120543253197 33.95305648224689 81.47547965205308 46.10623747140181 60 53 5 79 -56 53 -80.16182750370746 44.28326032302857 -102.64521233364405 32.73773838333142 -120 22"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // sandhold_building
    const sandhold_building = scene.add.image(
      0,
      -80,
      "factions",
      "buildings/tivara/sandhold/foundation/foundation_1.png"
    );
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
