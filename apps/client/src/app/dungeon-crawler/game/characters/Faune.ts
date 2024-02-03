/* eslint-disable @typescript-eslint/no-namespace */
import { AnimationsFaune, AssetsDungeon, DungeonCrawlerSceneEventTypes } from "../assets";
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
  private movePath: Phaser.Math.Vector2[] = [];
  private moveToTarget?: Phaser.Math.Vector2;

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

  moveAlong(path: Phaser.Math.Vector2[]) {
    if (!path || path.length <= 0) {
      return;
    }

    this.movePath = path;
    this.moveTo(this.movePath.shift()!);
  }

  moveTo(target: Phaser.Math.Vector2) {
    this.moveToTarget = target;
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
    const hasMovedByKeys = this.moveByKeys(cursors, speed);
    const hasMovedByClick = this.moveByClick(speed);

    if (!hasMovedByKeys && !hasMovedByClick) {
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
      // so collision is working ok
      // because of half of width of character
      this.body!.offset.x = 24;
      movedByKeys = true;
    } else if (cursors.right?.isDown) {
      this.anims.play(AnimationsFaune.runSide, true);
      this.setVelocity(speed, 0);
      this.scaleX = 1;
      // so collision is working ok
      // because of half of width of character
      this.body!.offset.x = 8;
      movedByKeys = true;
    } else if (cursors.up?.isDown) {
      this.anims.play(AnimationsFaune.runUp, true);
      this.setVelocity(0, -speed);
      movedByKeys = true;
    } else if (cursors.down?.isDown) {
      this.anims.play(AnimationsFaune.runDown, true);
      this.setVelocity(0, speed);
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

  private moveByClick(speed: number): boolean {
    let dx = 0;
    let dy = 0;
    let movedByClick = false;

    if (this.moveToTarget) {
      dx = this.moveToTarget.x - this.x;
      dy = this.moveToTarget.y - this.y;

      if (Math.abs(dx) < 5) {
        dx = 0;
      }
      if (Math.abs(dy) < 5) {
        dy = 0;
      }

      if (dx === 0 && dy === 0) {
        if (this.movePath.length > 0) {
          this.moveTo(this.movePath.shift()!);
          movedByClick = true;
          return movedByClick;
        }

        this.moveToTarget = undefined;
      }
    }

    // this logic is the same except we determine
    // if a key is down based on dx and dy
    const leftDown = dx < 0;
    const rightDown = dx > 0;
    const upDown = dy < 0;
    const downDown = dy > 0;

    if (leftDown) {
      this.anims.play("faune-run-side", true);
      this.setVelocity(-speed, 0);

      this.flipX = true;
      movedByClick = true;
    } else if (rightDown) {
      this.anims.play("faune-run-side", true);
      this.setVelocity(speed, 0);

      this.flipX = false;
      movedByClick = true;
    } else if (upDown) {
      this.anims.play("faune-run-up", true);
      this.setVelocity(0, -speed);
      movedByClick = true;
    } else if (downDown) {
      this.anims.play("faune-run-down", true);
      this.setVelocity(0, speed);
      movedByClick = true;
    }
    return movedByClick;
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
    sprite.body!.setSize(sprite.width * 0.5, sprite.height * 0.8);

    return sprite;
  }
);
