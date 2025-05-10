// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "../../data/object-names";
/* END-USER-IMPORTS */

export default class Badger extends Phaser.GameObjects.Sprite {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 21, y ?? 19.84684741722598, texture || "animals_2", frame ?? "badger/idle/se/00.png");

    this.setInteractive(new Phaser.Geom.Ellipse(21, 16, 42, 32), Phaser.Geom.Ellipse.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.5801426545255413);
    this.play("badger/idle/se");

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Badger;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
