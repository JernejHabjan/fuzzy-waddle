// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { DepthHelper } from "../../../world/map/depth.helper";
import { throttle } from "../../../library/throttle";
import { setActorData } from "../../../data/actor-data";
import { OwnerComponent } from "../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
/* END-USER-IMPORTS */

export default class SkaduweeOwl extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 33, y ?? 127.37785319200148);

    this.setInteractive(new Phaser.Geom.Circle(1, 4, 11), Phaser.Geom.Circle.Contains);

    // owl
    const owl = scene.add.sprite(0, -108, "units", "skaduwee/owl/idle/down_1.png");
    owl.play("skaduwee/owl/idle/down");
    this.add(owl);

    this.owl = owl;

    /* START-USER-CTR-CODE */
    setActorData(this, [new OwnerComponent(this), new SelectableComponent(this)], []);

    /* END-USER-CTR-CODE */
  }

  private owl: Phaser.GameObjects.Sprite;
  private delayedCaller?: Phaser.Time.TimerEvent;

  /* START-USER-CODE */

  override addedToScene() {
    super.addedToScene();

    this.drawFlyingUnitVerticalLine();
    this.moveOwl();
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

  /**
   * move owl around randomly. After 3-5 seconds, move to a new random location.
   */
  private moveOwl(): void {
    if (!this.active) return;
    const startX = this.x;
    const startY = this.y;

    const targetX = startX + Phaser.Math.Between(-200, 200);
    const targetY = startY + Phaser.Math.Between(-100, 100);

    const duration = Phaser.Math.Between(3000, 5000);

    const throttledSetActorDepth = throttle(this.setActorDepth, 360);
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY,
      duration,
      ease: "Sine.easeInOut",
      yoyo: false,
      repeat: 0,
      onUpdate: () => {
        throttledSetActorDepth();
      }
    });

    // after 3-5 seconds, move to a new random location
    this.delayedCaller = this.scene.time.delayedCall(duration, this.moveOwl, [], this);
  }

  private setActorDepth = () => {
    DepthHelper.setActorDepth(this);
  };

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.delayedCaller?.destroy();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
