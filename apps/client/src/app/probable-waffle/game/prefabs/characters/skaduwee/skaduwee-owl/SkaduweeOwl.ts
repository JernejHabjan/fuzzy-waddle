// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class SkaduweeOwl extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 24, y ?? 24, texture || "units", frame ?? "skaduwee/owl/idle/down_1.png");

    this.setInteractive(new Phaser.Geom.Circle(24, 24, 24), Phaser.Geom.Circle.Contains);
    this.play("skaduwee/owl/idle/down");

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.SkaduweeOwl;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
