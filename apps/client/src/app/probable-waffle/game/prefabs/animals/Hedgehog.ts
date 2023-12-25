// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
import {
  ANIM_HEDGEHOG_BALL_DOWN,
  ANIM_HEDGEHOG_BALL_LEFT,
  ANIM_HEDGEHOG_BALL_RIGHT,
  ANIM_HEDGEHOG_BALL_TOP,
  ANIM_HEDGEHOG_IDLE_DOWN,
  ANIM_HEDGEHOG_IDLE_LEFT,
  ANIM_HEDGEHOG_IDLE_RIGHT,
  ANIM_HEDGEHOG_IDLE_TOP,
  ANIM_HEDGEHOG_WALK_DOWN,
  ANIM_HEDGEHOG_WALK_LEFT,
  ANIM_HEDGEHOG_WALK_RIGHT,
  ANIM_HEDGEHOG_WALK_TOP
} from "./anims/animals";
/* END-USER-IMPORTS */

export default class Hedgehog extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 16, y ?? 21.81134207891933);

    this.removeInteractive();
    this.setInteractive(new Phaser.Geom.Circle(0, -5.81134191845878, 16), Phaser.Geom.Circle.Contains);

    // hedgehog
    const hedgehog = scene.add.sprite(0, -5.811342078919331, "animals", "hedgehog/10.png");
    this.add(hedgehog);

    // this (prefab fields)
    this.z = 0;

    this.hedgehog = hedgehog;

    /* START-USER-CTR-CODE */
    this.moveHedgehog();
    this.handleClick();
    /* END-USER-CTR-CODE */
  }

  private hedgehog: Phaser.GameObjects.Sprite;

  /* START-USER-CODE */
  private currentDelay: Phaser.Time.TimerEvent | null = null;
  private currentTween: Phaser.Tweens.Tween | null = null;

  private handleClick() {
    this.on("pointerdown", () => {
      // Cancel the current delay if it exists
      if (this.currentDelay) {
        this.currentDelay.remove(false);
        this.currentDelay = null;
      }

      // Stop the current tween if it exists
      if (this.currentTween) {
        this.currentTween.stop();
        this.currentTween = null;
      }

      // get appropriate ball animation
      let ballAnim: string;
      switch (this.hedgehog.anims.currentAnim?.key) {
        case ANIM_HEDGEHOG_WALK_DOWN:
          ballAnim = ANIM_HEDGEHOG_BALL_DOWN;
          break;
        case ANIM_HEDGEHOG_WALK_LEFT:
          ballAnim = ANIM_HEDGEHOG_BALL_LEFT;
          break;
        case ANIM_HEDGEHOG_WALK_RIGHT:
          ballAnim = ANIM_HEDGEHOG_BALL_RIGHT;
          break;
        case ANIM_HEDGEHOG_WALK_TOP:
          ballAnim = ANIM_HEDGEHOG_BALL_TOP;
          break;
        default:
          ballAnim = ANIM_HEDGEHOG_BALL_DOWN;
      }
      this.hedgehog.play(ballAnim);
      this.scene.time.delayedCall(5000, this.moveHedgehog, [], this);
    });
  }
  moveHedgehog() {
    const startX = this.x;
    const startY = this.y;

    const targetX = startX + Phaser.Math.Between(-200, 200);
    const targetY = startY + Phaser.Math.Between(-100, 100);

    const directionX = targetX - startX;
    const directionY = targetY - startY;

    let walkAnim: string;
    let ballAnim: string;
    let idleAnim: string;

    if (Math.abs(directionX) > Math.abs(directionY)) {
      if (directionX > 0) {
        walkAnim = ANIM_HEDGEHOG_WALK_RIGHT;
        ballAnim = ANIM_HEDGEHOG_BALL_RIGHT;
        idleAnim = ANIM_HEDGEHOG_IDLE_RIGHT;
      } else {
        walkAnim = ANIM_HEDGEHOG_WALK_LEFT;
        ballAnim = ANIM_HEDGEHOG_BALL_LEFT;
        idleAnim = ANIM_HEDGEHOG_IDLE_LEFT;
      }
    } else {
      if (directionY > 0) {
        walkAnim = ANIM_HEDGEHOG_WALK_DOWN;
        ballAnim = ANIM_HEDGEHOG_BALL_DOWN;
        idleAnim = ANIM_HEDGEHOG_IDLE_DOWN;
      } else {
        walkAnim = ANIM_HEDGEHOG_WALK_TOP;
        ballAnim = ANIM_HEDGEHOG_BALL_TOP;
        idleAnim = ANIM_HEDGEHOG_IDLE_TOP;
      }
    }

    // Randomly decide if the hedgehog should pause and play an idle animation
    if (Phaser.Math.Between(0, 10) < 3) {
      this.hedgehog.play(idleAnim);
      this.currentDelay = this.scene.time.delayedCall(
        5000,
        () => {
          this.moveHedgehog();
        },
        [],
        this
      );
    } else {
      this.currentTween = this.scene.tweens.add({
        targets: this,
        x: targetX,
        y: targetY,
        duration: 2000, // adjust as needed
        onStart: () => {
          this.hedgehog.play(walkAnim);
        },
        onComplete: () => {
          this.hedgehog.play(ballAnim);
          this.scene.time.delayedCall(5000, this.moveHedgehog, [], this);
        }
      });
    }
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
