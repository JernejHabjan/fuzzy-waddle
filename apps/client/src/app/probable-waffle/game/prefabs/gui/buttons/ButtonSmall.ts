// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventEmitter } from "@angular/core";
/* END-USER-IMPORTS */

export default class ButtonSmall extends Phaser.GameObjects.NineSlice {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string, width?: number, height?: number, leftWidth?: number, rightWidth?: number, topHeight?: number, bottomHeight?: number) {
		super(scene, x ?? 10, y ?? 10, texture || "gui", frame ?? "cryos_mini_gui/buttons/button_small.png", width ?? 20, height ?? 20, leftWidth ?? 5, rightWidth ?? 5, topHeight ?? 5, bottomHeight ?? 5);

		/* START-USER-CTR-CODE */
    this.setInteractive();
    this.on("pointerdown", () => {
      this.setTexture("gui", "cryos_mini_gui/buttons/button_small_pressed.png");
      this.clicked.emit();
      setTimeout(() => {
        if (!scene.sys.textures) return;
        this.setTexture("gui", "cryos_mini_gui/buttons/button_small.png");
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
