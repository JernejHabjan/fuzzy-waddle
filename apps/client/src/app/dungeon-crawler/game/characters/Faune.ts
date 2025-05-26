/* eslint-disable @typescript-eslint/no-namespace */
import { AnimationsFaune, AssetsDungeon, DungeonCrawlerSceneEventTypes } from "../assets";
import { sceneEvents } from "../events/EventCenter";

declare global {
  namespace Phaser.GameObjects {
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
  public lastKnifeTime = 0;
  public knifeCooldown = 500;

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
    sceneEvents.emit(DungeonCrawlerSceneEventTypes.playerHealthChanged, this._health);

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

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, t: number, dt: number, joystick?: any, joystickRight?: any) {
    super.update(t, dt);
    if (this.healthState === HealthState.DAMAGE || this.healthState === HealthState.DEAD) {
      // dont do movement if damaged
      return;
    }

    // Joystick movement
    let movedByJoystick = false;
    if (joystick && joystick.force > 0) {
      const baseSpeed = 8000;
      const speed = baseSpeed * (dt / 1000);
      const angle = joystick.angle; // degrees
      const rad = Phaser.Math.DegToRad(angle);
      const vx = Math.cos(rad) * speed;
      const vy = Math.sin(rad) * speed;

      // Animation by direction
      if (Math.abs(vx) > Math.abs(vy)) {
        // Horizontal
        this.anims.play(AnimationsFaune.runSide, true);
        this.setVelocity(vx, 0);
        this.scaleX = vx < 0 ? -1 : 1;
        this.body!.offset.x = vx < 0 ? 24 : 8;
      } else {
        // Vertical
        if (vy < 0) {
          this.anims.play(AnimationsFaune.runUp, true);
        } else {
          this.anims.play(AnimationsFaune.runDown, true);
        }
        this.setVelocity(0, vy);
      }
      movedByJoystick = true;
    }

    // Right joystick attack (fire in joystick direction, with cooldown)
    if (joystickRight && joystickRight.force > 0) {
      if (t - this.lastKnifeTime > this.knifeCooldown) {
        this.throwKnife(joystickRight.angle);
        this.lastKnifeTime = t;
      }
    }

    if (!movedByJoystick) {
      // Keyboard fallback
      if (!cursors) {
        return;
      }

      if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
        if (t - this.lastKnifeTime > this.knifeCooldown) {
          this.throwKnife();
          this.lastKnifeTime = t;
        }
        return;
      }

      const baseSpeed = 8000;
      const speed = baseSpeed * (dt / 1000);

      const hasMovedByKeys = this.moveByKeys(cursors, speed);

      if (!hasMovedByKeys) {
        // update direction we're facing by anim key name
        const parts = this.anims.currentAnim!.key.split("-");
        parts[1] = "idle";
        this.anims.play(parts.join("-"));
        this.setVelocity(0, 0);
      }
    }
  }

  updateWASD(
    wasd: {
      up: Phaser.Input.Keyboard.Key;
      down: Phaser.Input.Keyboard.Key;
      left: Phaser.Input.Keyboard.Key;
      right: Phaser.Input.Keyboard.Key;
    },
    t: number,
    dt: number
  ) {
    if (this.healthState === HealthState.DAMAGE || this.healthState === HealthState.DEAD) {
      return;
    }

    // WASD movement
    let moved = false;
    const baseSpeed = 8000;
    const speed = baseSpeed * (dt / 1000);

    if (wasd.left.isDown) {
      this.anims.play(AnimationsFaune.runSide, true);
      this.setVelocity(-speed, 0);
      this.scaleX = -1;
      this.body!.offset.x = 24;
      moved = true;
    } else if (wasd.right.isDown) {
      this.anims.play(AnimationsFaune.runSide, true);
      this.setVelocity(speed, 0);
      this.scaleX = 1;
      this.body!.offset.x = 8;
      moved = true;
    } else if (wasd.up.isDown) {
      this.anims.play(AnimationsFaune.runUp, true);
      this.setVelocity(0, -speed);
      moved = true;
    } else if (wasd.down.isDown) {
      this.anims.play(AnimationsFaune.runDown, true);
      this.setVelocity(0, speed);
      moved = true;
    }

    if (!moved) {
      // update direction we're facing by anim key name
      const parts = this.anims.currentAnim!.key.split("-");
      parts[1] = "idle";
      this.anims.play(parts.join("-"));
      this.setVelocity(0, 0);
    }
  }

  private moveByKeys(cursors: Phaser.Types.Input.Keyboard.CursorKeys, speed: number): boolean {
    let movedByKeys = false;
    if (cursors.left?.isDown) {
      this.anims.play(AnimationsFaune.runSide, true);
      this.setVelocity(-speed, 0);
      this.scaleX = -1;
      this.body!.offset.x = 24;
      movedByKeys = true;
    } else if (cursors.right?.isDown) {
      this.anims.play(AnimationsFaune.runSide, true);
      this.setVelocity(speed, 0);
      this.scaleX = 1;
      this.body!.offset.x = 8;
      movedByKeys = true;
    } else if (cursors.up?.isDown) {
      this.anims.play(AnimationsFaune.runUp, true);
      this.setVelocity(0, -speed);
      movedByKeys = true;
    } else if (cursors.down?.isDown) {
      this.anims.play(AnimationsFaune.runDown, true);
      this.setVelocity(0, speed);
      movedByKeys = true;
    }
    return movedByKeys;
  }

  public throwKnife(angleDeg?: number) {
    if (!this.knives) {
      return;
    }

    const knife = this.knives.get(this.x, this.y, "knife") as Phaser.Physics.Arcade.Image;
    if (!knife) {
      return;
    }

    let vec = new Phaser.Math.Vector2(0, 0);

    if (typeof angleDeg === "number") {
      // Fire in joystick or pointer direction
      const rad = Phaser.Math.DegToRad(angleDeg);
      vec.x = Math.cos(rad);
      vec.y = Math.sin(rad);
      if (vec.lengthSq() === 0) {
        vec.y = 1; // fallback to down
      }
      vec = vec.normalize();
    } else {
      // Keyboard/animation-based direction
      const parts = this.anims.currentAnim!.key.split("-");
      const direction = parts[2];

      switch (direction) {
        case "up":
          vec.y = -1;
          break;
        case "down":
          vec.y = 1;
          break;
        default:
        case "side":
          if (this.scaleX < 0) {
            vec.x = -1;
          } else {
            vec.x = 1;
          }
          break;
      }
    }

    const angle = vec.angle();

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

    // half the width and height for better collision
    sprite.body!.setSize(sprite.width * 0.5, sprite.height * 0.8);

    return sprite;
  }
);
