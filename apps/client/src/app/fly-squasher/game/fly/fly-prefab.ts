import { Subject } from 'rxjs';

// prefab combined in Phaser Editor 2D
export class FlyPrefab extends Phaser.GameObjects.Container {
  pointerDown: Subject<void> = new Subject<void>();
  private readonly leg_back_right: Phaser.GameObjects.Image;
  private readonly leg_back_left: Phaser.GameObjects.Image;
  private readonly leg_front_right: Phaser.GameObjects.Image;
  private readonly leg_front_left: Phaser.GameObjects.Image;
  private readonly leg_middle_right: Phaser.GameObjects.Image;
  private readonly leg_middle_left: Phaser.GameObjects.Image;
  private readonly fly_body: Phaser.GameObjects.Image;
  private readonly wing_left: Phaser.GameObjects.Image;
  private readonly wing_right: Phaser.GameObjects.Image;
  private readonly head_container: Phaser.GameObjects.Container;
  private readonly head: Phaser.GameObjects.Image;
  private readonly suckler: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    this.width = 120;
    this.height = 120;

    // leg_back_right
    this.leg_back_right = scene.add.image(
      14.450684318372382,
      -0.6341442773239621,
      'fly-squasher-spritesheet',
      'fly/leg-back'
    );
    this.leg_back_right.setOrigin(0, 1);
    this.add(this.leg_back_right);

    // leg_back_left
    this.leg_back_left = scene.add.image(
      -15.549315681627625,
      -2.634144277323962,
      'fly-squasher-spritesheet',
      'fly/leg-back'
    );
    this.leg_back_left.setOrigin(1, 1);
    this.leg_back_left.flipX = true;
    this.add(this.leg_back_left);

    // leg_front_right
    this.leg_front_right = scene.add.image(
      12.450684318372382,
      31.365855722676038,
      'fly-squasher-spritesheet',
      'fly/leg-front'
    );
    this.leg_front_right.setOrigin(0, 0);
    this.add(this.leg_front_right);

    // leg_front_left
    this.leg_front_left = scene.add.image(
      -13.549315681627625,
      31.365855722676038,
      'fly-squasher-spritesheet',
      'fly/leg-front'
    );
    this.leg_front_left.setOrigin(1, 0);
    this.leg_front_left.flipX = true;
    this.add(this.leg_front_left);

    // leg_middle_right
    this.leg_middle_right = scene.add.image(
      12.450684318372382,
      8.365855722676038,
      'fly-squasher-spritesheet',
      'fly/leg-middle'
    );
    this.leg_middle_right.setOrigin(0, 0.5);
    this.add(this.leg_middle_right);

    // leg_middle_left
    this.leg_middle_left = scene.add.image(
      -13.549315681627625,
      7.365855722676038,
      'fly-squasher-spritesheet',
      'fly/leg-middle'
    );
    this.leg_middle_left.setOrigin(1, 0.5);
    this.leg_middle_left.flipX = true;
    this.add(this.leg_middle_left);

    // body
    this.fly_body = scene.add.image(0, -4, 'fly-squasher-spritesheet', 'fly/body');
    this.add(this.fly_body);

    // wing_left
    this.wing_left = scene.add.image(-16, 21, 'fly-squasher-spritesheet', 'fly/wing');
    this.wing_left.setOrigin(0.27, 0.98);
    this.add(this.wing_left);

    // wing_right
    this.wing_right = scene.add.image(15.770684318372375, 22.39585572267604, 'fly-squasher-spritesheet', 'fly/wing');
    this.wing_right.setOrigin(0.7, 0.99);
    this.wing_right.flipX = true;
    this.add(this.wing_right);

    // head_container
    this.head_container = scene.add.container(-0.949315681627624, 35.59585572267604);
    this.add(this.head_container);

    // fly_head
    this.head = scene.add.image(0.4, 0, 'fly-squasher-spritesheet', 'fly/head');
    this.head.setOrigin(0.5, 0);
    this.head_container.add(this.head);

    // fly_suckler
    this.suckler = scene.add.image(0, 19.8, 'fly-squasher-spritesheet', 'fly/suckler');
    this.suckler.setOrigin(0.58, 0);
    this.head_container.add(this.suckler);

    this.applyToNonContainerChildren(this, (child) => {
      child.setInteractive();
      child.on('pointerdown', () => {
        this.pointerDown.next();
      });
    });

    this.startWalking();
    this.startFlying();
  }

  private tweenLimb(target: Phaser.GameObjects.Image, angle: number, duration = 200) {
    this.scene.tweens.add({
      targets: target,
      angle: { start: target.angle, to: angle },
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
      duration: duration
    });
  }

  startWalking() {
    this.tweenLimb(this.leg_back_right, 20);
    this.tweenLimb(this.leg_back_left, -20);
    this.tweenLimb(this.leg_front_right, -20);
    this.tweenLimb(this.leg_front_left, 20);
    this.tweenLimb(this.leg_middle_right, 20);
    this.tweenLimb(this.leg_middle_left, -20);
  }

  startFlying() {
    this.tweenLimb(this.wing_left, 90, 50);
    this.tweenLimb(this.wing_right, -90, 50);
  }

  override destroy(fromScene?: boolean) {
    this.scene.tweens.killTweensOf([
      this.leg_back_right,
      this.leg_back_left,
      this.leg_front_right,
      this.leg_front_left,
      this.leg_middle_right,
      this.leg_middle_left,
      this.wing_left,
      this.wing_right
    ]);

    this.pointerDown.complete();
    // remove all listeners
    this.applyToNonContainerChildren(this, (child) => {
      child.removeAllListeners();
    });

    super.destroy(fromScene);
  }

  /**
   * recursive function to apply a function to all children of a container
   */
  private applyToNonContainerChildren(
    container: Phaser.GameObjects.Container,
    fn: (child: Phaser.GameObjects.GameObject) => void
  ) {
    container.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Container) {
        this.applyToNonContainerChildren(child, fn);
      } else {
        fn(child);
      }
    });
  }
}
