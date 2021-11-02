/* eslint-disable @typescript-eslint/no-namespace */
import { AnimationsFaune, AssetsDungeon, SceneEventTypes } from "../assets";
import { sceneEvents } from "../events/EventCenter";

declare global {
  namespace Phaser.GameObjects {
    // todo eslint
    interface GameObjectFactory {
      faune(x: number, y: number, frame?: string | number): Faune;
    }
  }
}

enum HealthState {
  HEALTHY,
  DAMAGE,
  DEAD
}

export default class Faune extends Phaser.Physics.Arcade.Sprite {
  private knives?: Phaser.Physics.Arcade.Group;
  private healthState = HealthState.HEALTHY;
  private damageTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, frame?: string | number) {
    super(scene, x, y, AssetsDungeon.faune, frame);

    this.anims.play(AnimationsFaune.idleDown);
  }

  private _health = 3;

  get health(): number {
    return this._health;
  }

  setKnives(knives: Phaser.Physics.Arcade.Group) {
    this.knives = knives;
  }

  handleDamage(dir: Phaser.Math.Vector2) {
    if (this._health <= 0) {
      return;
    }
    if (this.healthState === HealthState.DAMAGE) {
      return;
    }

    --this._health;
    sceneEvents.emit(SceneEventTypes.playerHealthChanged, this._health);

    if (this._health <= 0) {
      // die
      this.healthState = HealthState.DEAD;
      this.anims.play(AnimationsFaune.faint);
      this.setVelocity(0, 0);
    } else {
      // injure if not dying yet
      this.setVelocity(dir.x, dir.y);
      this.setTint(0xfff0000);

      this.healthState = HealthState.DAMAGE;
      this.damageTime = 0;
    }
  }

  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt);
    switch (this.healthState) {
      case HealthState.HEALTHY:
        break;
      case HealthState.DAMAGE:
        this.damageTime += dt;
        if (this.damageTime >= 250) {
          this.healthState = HealthState.HEALTHY;
          this.setTint(0xffffff);
          this.damageTime = 0;
        }
        break;
    }
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
    super.update();
    if (this.healthState === HealthState.DAMAGE || this.healthState === HealthState.DEAD) {
      // dont do movement if damaged
      return;
    }

    if (!cursors) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
      this.throwKnife();
      return;
    }

    const speed = 100;

    if (cursors.left?.isDown) {
      this.anims.play(AnimationsFaune.runSide, true);
      this.setVelocity(-speed, 0);
      this.scaleX = -1;
      // so collision is working ok
      // because of half of width of character
      this.body.offset.x = 24;
    } else if (cursors.right?.isDown) {
      this.anims.play(AnimationsFaune.runSide, true);
      this.setVelocity(speed, 0);
      this.scaleX = 1;
      // so collision is working ok
      // because of half of width of character
      this.body.offset.x = 8;
    } else if (cursors.up?.isDown) {
      this.anims.play(AnimationsFaune.runUp, true);
      this.setVelocity(0, -speed);
    } else if (cursors.down?.isDown) {
      this.anims.play(AnimationsFaune.runDown, true);
      this.setVelocity(0, speed);
    } else {
      // update direction we're facing by anim key name
      const parts = this.anims.currentAnim.key.split("-");
      parts[1] = "idle";
      this.anims.play(parts.join("-"));
      this.setVelocity(0, 0);
    }
  }

  private throwKnife() {
    if (!this.knives) {
      return;
    }

    // get direction we're facing by anim key name
    const parts = this.anims.currentAnim.key.split("-");
    const direction = parts[2];

    const vec = new Phaser.Math.Vector2(0, 0);

    // todo also set knife size (so collision box is correct size)
    switch (direction) {
      case "up":
        vec.y = -1;
        break;
      case "down":
        vec.y = 1;
        break;

      case "side":
        // where we're flipped - left or right
        if (this.scaleX < 0) {
          vec.x = -1;
        } else {
          vec.x = 1;
        }
        break;
    }

    const angle = vec.angle();
    const knife = this.knives?.get(this.x, this.y, AssetsDungeon.knife) as Phaser.Physics.Arcade.Image;

    // because of killAndHide function call
    knife.setActive(true);
    knife.setVisible(true);

    knife.setRotation(angle);

    knife.x += vec.x * 16;
    knife.y += vec.y * 16;

    knife.setVelocity(vec.x * 300, vec.y * 300);
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  AssetsDungeon.faune,
  function (this: Phaser.GameObjects.GameObjectFactory, x: number, y: number, frame?: string | number) {
    const sprite = new Faune(this.scene, x, y, frame);
    this.displayList.add(sprite);
    this.updateList.add(sprite);
    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY);

    // half width
    sprite.body.setSize(sprite.width * 0.5, sprite.height * 0.8);

    return sprite;
  }
);
