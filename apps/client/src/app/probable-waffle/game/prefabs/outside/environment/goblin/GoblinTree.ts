
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class GoblinTree extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 6.251536193002131, y ?? 64.5525838759272, texture || "environment_1", frame ?? "goblin/tree.png");

    this.setInteractive(new Phaser.Geom.Polygon("0 34.5 16.36014736178263 5.5589829964632145 75.5 0 106.71774586632623 26.454177650638925 151 34.5 134.9544953989961 80.66873675336511 85.25781622149711 95.91658150100686 88.08149117476412 133.18909088413108 16.924882352436022 130.9301509215175 32.737462090731164 102.12866639819423 3.935977567407839 64.85615701506997"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.329480372139087, 0.8699462599704869);

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
