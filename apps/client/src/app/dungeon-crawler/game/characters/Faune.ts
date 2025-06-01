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
      return;
    }

    const baseSpeed = 8000;
    const speed = baseSpeed * (dt / 1000);

    let vx = 0;
    let vy = 0;

    // --- Joystick movement ---
    if (joystick && joystick.force > 0) {
      const angle = Phaser.Math.DegToRad(joystick.angle);
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed;
    } else if (cursors) {
      if (cursors.left?.isDown) {
        vx -= speed;
      }
      if (cursors.right?.isDown) {
        vx += speed;
      }
      if (cursors.up?.isDown) {
        vy -= speed;
      }
      if (cursors.down?.isDown) {
        vy += speed;
      }
    }

    // Normalize diagonal movement
    const lenSq = vx * vx + vy * vy;
    if (lenSq > 0) {
      const len = Math.sqrt(lenSq);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;
    }

    this.setVelocity(vx, vy);

    // --- Animation ---
    if (Math.abs(vx) > Math.abs(vy)) {
      this.anims.play(AnimationsFaune.runSide, true);
      this.scaleX = vx < 0 ? -1 : 1;
      this.body!.offset.x = vx < 0 ? 24 : 8;
    } else if (Math.abs(vy) > 0) {
      this.anims.play(vy < 0 ? AnimationsFaune.runUp : AnimationsFaune.runDown, true);
    } else {
      // Idle
      const parts = this.anims.currentAnim?.key.split("-");
      if (parts && parts.length >= 3) {
        parts[1] = "idle";
        this.anims.play(parts.join("-"));
      }
    }

    // --- Attack: Right joystick or spacebar ---
    if (joystickRight && joystickRight.force > 0) {
      if (t - this.lastKnifeTime > this.knifeCooldown) {
        this.throwKnife(joystickRight.angle);
        this.lastKnifeTime = t;
      }
    } else if (cursors && Phaser.Input.Keyboard.JustDown(cursors.space)) {
      if (t - this.lastKnifeTime > this.knifeCooldown) {
        this.throwKnife();
        this.lastKnifeTime = t;
      }
    }
  }

  updateWASD(wasd: { up: any; down: any; left: any; right: any }, t: number, dt: number) {
    if (this.healthState === HealthState.DAMAGE || this.healthState === HealthState.DEAD) return;

    const direction = new Phaser.Math.Vector2(0, 0);
    const baseSpeed = 8000;
    const speed = baseSpeed * (dt / 1000);

    if (wasd.left.isDown) direction.x = -1;
    else if (wasd.right.isDown) direction.x = 1;

    if (wasd.up.isDown) direction.y = -1;
    else if (wasd.down.isDown) direction.y = 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.setVelocity(direction.x * speed, direction.y * speed);

      if (Math.abs(direction.x) > Math.abs(direction.y)) {
        this.anims.play(AnimationsFaune.runSide, true);
        this.scaleX = direction.x < 0 ? -1 : 1;
        this.body!.offset.x = direction.x < 0 ? 24 : 8;
      } else if (direction.y < 0) {
        this.anims.play(AnimationsFaune.runUp, true);
      } else {
        this.anims.play(AnimationsFaune.runDown, true);
      }
    } else {
      // idle animation
      const parts = this.anims.currentAnim!.key.split("-");
      parts[1] = "idle";
      this.anims.play(parts.join("-"));
      this.setVelocity(0, 0);
    }
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
