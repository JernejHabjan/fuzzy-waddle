// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
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
import { DepthHelper } from "../../world/map/depth.helper";
/* END-USER-IMPORTS */

export default class Hedgehog extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 21.596080279718947, texture || "animals", frame ?? "hedgehog/10.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 18, 11.323425464509395), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6748775087412171);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private currentDelay: Phaser.Time.TimerEvent | null = null;
  private currentTween: Phaser.Tweens.Tween | null = null;

  override addedToScene() {
    super.addedToScene();

    this.moveHedgehog();
    this.handleClick();
  }

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
      switch (this.anims.currentAnim?.key) {
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
      this.play(ballAnim);
      this.scene.time.delayedCall(5000, this.moveHedgehog, [], this);
    });
  }
  moveHedgehog() {
    if (!this.active) return;
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
      this.play(idleAnim);
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
          if (!this.active) return;
          this.play(walkAnim);
        },
        onUpdate: () => {
          DepthHelper.setActorDepth(this);
        },
        onComplete: () => {
          if (!this.active) return;
          this.play(ballAnim);
          this.scene.time.delayedCall(5000, this.moveHedgehog, [], this);
        }
      });
    }
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.currentDelay?.remove(false);
    this.currentTween?.stop();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
