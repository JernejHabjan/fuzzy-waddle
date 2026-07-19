// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Croissants extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 2.221526863075212, y ?? 1.6450976306480243);

    // towel
    const towel = scene.add.image(124.77847146244132, 103.35489880789905, "croissants-spritesheet", "croissants/towel");
    this.add(towel);

    // plate
    const plate = scene.add.image(129.7784714624413, 91.35489880789905, "croissants-spritesheet", "croissants/plate");
    this.add(plate);

    // croissant_bottom
    const croissant_bottom = scene.add.image(
      153.7784714624413,
      65.35489880789905,
      "croissants-spritesheet",
      "croissants/croissant"
    );
    croissant_bottom.angle = 132;
    this.add(croissant_bottom);

    // croissant_top
    const croissant_top = scene.add.image(
      99.77847146244132,
      66.35489880789905,
      "croissants-spritesheet",
      "croissants/croissant"
    );
    this.add(croissant_top);

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
