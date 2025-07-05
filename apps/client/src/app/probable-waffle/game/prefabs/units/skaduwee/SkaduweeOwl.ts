// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */

import { onObjectReady } from "../../../data/game-object-helper";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class SkaduweeOwl extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 33, y ?? 127.37785319200148);

    this.setInteractive(new Phaser.Geom.Circle(0, -109, 15.412651300123422), Phaser.Geom.Circle.Contains);

    // owl
    const owl = scene.add.sprite(0, -108, "units", "skaduwee/owl/idle/down_1.png");
    owl.play("skaduwee/owl/idle/down");
    this.add(owl);

    this.owl = owl;

    /* START-USER-CTR-CODE */
    onObjectReady(this, this.postSceneCreate, this);
    /* END-USER-CTR-CODE */
  }

  private owl: Phaser.GameObjects.Sprite;

  /* START-USER-CODE */
  name = ObjectNames.SkaduweeOwl;

  private postSceneCreate() {
    this.drawFlyingUnitVerticalLine();
  }

  /**
   * draw a vertical line from bottom of unit to bottom of current container.
   * at the bottom of the line, draw a dot.
   */
  private drawFlyingUnitVerticalLine() {
    const owl = this.owl;
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(1, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(owl.x, owl.y + owl.height / 2);
    graphics.lineTo(owl.x, this.height);
    graphics.closePath();
    graphics.strokePath();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(owl.x, this.height, 2);
    graphics.setDepth(100);
    this.add(graphics);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
