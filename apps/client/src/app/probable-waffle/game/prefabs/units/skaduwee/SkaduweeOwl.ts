// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class SkaduweeOwl extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 33, y ?? 127.37785319200148);

    this.removeInteractive();
    this.setInteractive(new Phaser.Geom.Circle(1, 4, 11), Phaser.Geom.Circle.Contains);

    // owl
    const owl = scene.add.sprite(1, -107.3778401387357, "units", "skaduwee/owl/idle_down_1.png");
    owl.play("skaduwee/owl/idle/down");
    this.add(owl);

    // this (prefab fields)
    this.z = 0;

    this.owl = owl;

    /* START-USER-CTR-CODE */
    this.drawFlyingUnitVerticalLine();
    this.moveOwl();
    /* END-USER-CTR-CODE */
  }

  private owl: Phaser.GameObjects.Sprite;

  /* START-USER-CODE */

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

  /**
   * move owl around randomly. After 3-5 seconds, move to a new random location.
   */
  private moveOwl() {
    const startX = this.x;
    const startY = this.y;

    const targetX = startX + Phaser.Math.Between(-200, 200);
    const targetY = startY + Phaser.Math.Between(-100, 100);

    const duration = Phaser.Math.Between(3000, 5000);

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration,
      ease: "Sine.easeInOut",
      yoyo: false,
      repeat: 0
    });

    // after 3-5 seconds, move to a new random location
    this.scene.time.delayedCall(duration, this.moveOwl, [], this);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
