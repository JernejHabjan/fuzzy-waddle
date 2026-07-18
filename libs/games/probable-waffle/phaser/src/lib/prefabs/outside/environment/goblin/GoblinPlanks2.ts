
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class GoblinPlanks2 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48.45223017565329, texture || "environment_1", frame ?? "goblin/planks2.png");

    this.setInteractive(new Phaser.Geom.Polygon("7.599920554314409 17.8827666904182 17.021562022956296 14.924809485146916 31.92090201987834 22.812695365870354 17.021562022956296 31.029243158290605 0.36935849698458156 23.14135727756716"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5, 0.7328821929891653);

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
