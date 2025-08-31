// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { DepthHelper } from "../../world/map/depth.helper";
import { ANIM_BIRD_FLY, ANIM_BIRD_FLY_OFF, ANIM_BIRD_IDLE, ANIM_BIRD_IDLE_FLAP } from "./anims/anims-bird";
/* END-USER-IMPORTS */

export default class TreeBird extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 112.37994467473578, texture || "animals", frame ?? "1.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 16), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 3.511873290466627);
    this.play("bird-idle");

    /* START-USER-CTR-CODE */
    this.addClickListeners();
    this.playIdle();
    this.switchIdleAnimation();
    /* END-USER-CTR-CODE */
  }

  public z: number = 0;

  /* START-USER-CODE */
  private idle = true;
  private timer?: Phaser.Time.TimerEvent;
  private moveTween?: Phaser.Tweens.Tween;

  private addClickListeners() {
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.flyOff, this);
  }
  private playIdle() {
    const _ANIM_BIRD_IDLE = ANIM_BIRD_IDLE;
    const _ANIM_BIRD_IDLE_FLAP = ANIM_BIRD_IDLE_FLAP;
    this.idle = true;

    // choose random animation
    const randomAnim = Phaser.Math.RND.pick([_ANIM_BIRD_IDLE, _ANIM_BIRD_IDLE_FLAP]);
    // if _ANIM_BIRD_IDLE_FLAP, then play _ANIM_BIRD_IDLE after it
    if (randomAnim === _ANIM_BIRD_IDLE_FLAP) {
      this.play(_ANIM_BIRD_IDLE_FLAP);
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!this.active) return;
        this.play(_ANIM_BIRD_IDLE);
      });
    } else {
      this.play(randomAnim);
    }
  }

  private switchIdleAnimation() {
    // set timer to switch idle animation every 5 seconds if idle
    this.timer = this.scene.time.addEvent({
      delay: 5000,
      callback: () => {
        if (!this.active) return;
        if (this.idle) {
          this.playIdle();
        }
      },
      loop: true
    });
  }

  private flyOff() {
    if (!this.idle) return;
    this.idle = false;
    this.play(ANIM_BIRD_FLY_OFF);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.active) return;
      this.play(ANIM_BIRD_FLY);
      this.destroyTween();
      // start moving randomly in 1 direction for 2.5 seconds and then 2.5 seconds back
      this.moveTween = this.scene.tweens.add({
        targets: this,
        x: this.x + Phaser.Math.Between(-100, 100),
        y: this.y + Phaser.Math.Between(-100, 100),
        duration: 2500,
        yoyo: true,
        ease: "Power1",
        onUpdate: () => {
          if (!this.active) return;
          DepthHelper.setActorDepth(this);
        },
        onComplete: () => {
          if (!this.active) return;
          this.playIdle();
          this.idle = true;
        }
      });
    });
  }

  private destroyTween() {
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = undefined;
    }
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.off(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.flyOff, this);
    this.timer?.remove(false);
    this.destroyTween();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
