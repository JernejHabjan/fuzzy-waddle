
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class SmallWaterSlime extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 48, y ?? 59, texture || "mobs_slimes", frame ?? "Slime1/Idle/s/0.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 10.143579756251778), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.6081221897463076);
    this.play("mobs_Slime1/Idle/s");

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
