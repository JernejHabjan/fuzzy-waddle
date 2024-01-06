// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import { EventEmitter } from "@angular/core";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ButtonLarge extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 9, y ?? 8);

    // button
    const button = scene.add.image(3, 0, "gui", "cryos_mini_gui/buttons/button_large.png");
    this.add(button);

    // text_1
    const text_1 = scene.add.text(3, 0, "", {});
    text_1.setOrigin(0.5, 0.5);
    text_1.text = "Quit";
    text_1.setStyle({ align: "center", color: "#000000ff", fontSize: "8px" });
    this.add(text_1);

    /* START-USER-CTR-CODE */
    button.setInteractive();
    button.on("pointerdown", () => {
      button.setTexture("gui", "cryos_mini_gui/buttons/button_large_pressed.png");
      this.clicked.emit();
      setTimeout(() => {
        if (!scene.sys.textures) return;
        button.setTexture("gui", "cryos_mini_gui/buttons/button_large.png");
      }, 100);
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  clicked = new EventEmitter<void>();
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
