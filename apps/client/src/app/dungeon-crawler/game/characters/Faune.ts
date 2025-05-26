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

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, t: number, dt: number) {
    super.update(t, dt);
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

    // Use dt to make speed frame-rate independent
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

  private throwKnife() {
    if (!this.knives) {
      return;
    }

    const knife = this.knives.get(this.x, this.y, "knife") as Phaser.Physics.Arcade.Image;
    if (!knife) {
      return;
    }

    const parts = this.anims.currentAnim!.key.split("-");
    const direction = parts[2];

    const vec = new Phaser.Math.Vector2(0, 0);

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
