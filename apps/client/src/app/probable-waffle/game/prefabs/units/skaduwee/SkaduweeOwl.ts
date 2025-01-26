// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorDataFromName } from "../../../data/actor-data";

import { HealthComponent } from "../../../entity/combat/components/health-component";
import {
  moveGameObjectToRandomTileInNavigableRadius,
  MovementSystem,
  PathMoveConfig
} from "../../../entity/systems/movement.system";
import { onSceneInitialized } from "../../../data/game-object-helper";
import { getActorSystem } from "../../../data/actor-system";
import SkaduweeOwlFurball from "./SkaduweeOwlFurball";
import { ObjectNames } from "../../../data/object-names";
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
    setActorDataFromName(this);

    onSceneInitialized(scene, this.postSceneCreate, this);
    this.once(HealthComponent.KilledEvent, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  private owl: Phaser.GameObjects.Sprite;

  /* START-USER-CODE */
  name = ObjectNames.SkaduweeOwl;
  private readonly actionDelay = 5000;
  private readonly radius = 5;
  private currentDelay: Phaser.Time.TimerEvent | null = null;
  private furballEvent?: Phaser.Time.TimerEvent;

  private postSceneCreate() {
    this.drawFlyingUnitVerticalLine();
    this.moveOwl();
    this.startSpittingFurBalls();
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
  private async moveOwl(): Promise<void> {
    if (!this.active) return;

    try {
      await moveGameObjectToRandomTileInNavigableRadius(this, this.radius);
    } catch (e) {
      console.error(e);
    }

    this.moveAfterDelay();
  }

  private moveAfterDelay() {
    this.removeDelay();
    if (!this.active) return;
    this.currentDelay = this.scene.time.delayedCall(this.actionDelay, this.moveOwl, [], this);
  }

  cancelMovement() {
    const movementSystem = getActorSystem<MovementSystem>(this, MovementSystem);
    if (movementSystem) movementSystem.cancelMovement();
  }

  private removeDelay() {
    this.currentDelay?.remove(false);
    this.currentDelay = null;
  }

  private randomlySpitFurBall() {
    if (!this.active) {
      this.furballEvent?.remove(false);
      return;
    }

    const centerX = this.x;
    const centerY = this.y - this.owl.height * 2;
    const furball = new SkaduweeOwlFurball(this.scene, centerX, centerY);
    this.scene.add.existing(furball);
    // set depth same as actor
    furball.setDepth(this.depth);
    furball.setOrigin(0.5, 0.5);

    // move furball to some direction as projectile
    const direction = Phaser.Math.Between(0, 360);
    const distance = 100;
    const x = centerX + distance * Math.cos(direction);
    const y = centerY + distance * Math.sin(direction);
    this.scene.tweens.add({
      targets: furball,
      x,
      y,
      duration: 1000,
      onComplete: () => {
        furball.destroy();
      }
    });
  }

  private startSpittingFurBalls() {
    this.furballEvent = this.scene.time.addEvent({
      delay: 2000,
      callback: this.randomlySpitFurBall,
      callbackScope: this,
      loop: true
    });
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.cancelMovement();
    this.removeDelay();
    this.furballEvent?.remove(false);
    this.furballEvent = undefined;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
