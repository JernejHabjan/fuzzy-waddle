// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ButtonSmall extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 8, y ?? 8, texture || "gui", frame ?? "cryos_mini_gui/buttons/button_small.png");

    /* START-USER-CTR-CODE */

    this.setInteractive();
    this.on("pointerdown", () => {
      this.setTexture("gui", "cryos_mini_gui/buttons/button_small_pressed.png");
      setTimeout(() => {
        this.setTexture("gui", "cryos_mini_gui/buttons/button_small.png");
      }, 100);
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
