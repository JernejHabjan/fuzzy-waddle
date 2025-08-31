import { IFlyBase } from "../component.service";
import { FlyPrefab } from "../fly-prefab";
import { BaseScene } from "../../../../shared/game/phaser/scene/base.scene";
import { FlyBase } from "../FlyBase";
import { FlyOptions } from "../fly";
import { ANIM_BLOOD_SPLATTER } from "../blood-splatter";

export class FlyRepresentableComponent implements IFlyBase {
  private _fly!: FlyPrefab;

  constructor(
    private readonly fly: FlyBase,
    private readonly scene: BaseScene,
    private readonly actorOptions?: FlyOptions
  ) {}

  init() {
    this._fly = new FlyPrefab(this.scene);
    this.scene.add.existing(this._fly);
    this.manageSize();
  }

  destroy() {
    this._fly.destroy();
  }

  get width() {
    return this._fly.width;
  }

  get height() {
    return this._fly.height;
  }

  get y() {
    return this._fly.y;
  }

  set y(value: number) {
    this._fly.y = value;
  }

  get rotation() {
    return this._fly.rotation;
  }

  set rotation(value: number) {
    this._fly.rotation = value;
  }

  get x() {
    return this._fly.x;
  }

  set x(value: number) {
    this._fly.x = value;
  }

  setPosition(x: number, y: number) {
    this._fly.setPosition(x, y);
  }

  get pointerDown() {
    return this._fly.pointerDown;
  }

  off(eventName: string) {
    this._fly.off(eventName);
  }

  kill() {
    this._fly.stopMoving();
    this.displayBlood();
  }

  private manageSize = () => {
    this._fly.setScale(this.scale);
  };

  private get scale() {
    if (!this.actorOptions) return 1;
    switch (this.actorOptions.type) {
      case "boss":
        return 2;
      case "large-boss":
        return 3;
      default:
        return 1;
    }
  }

  update(): void {
    if (!this.fly.killedAt) return;
    if (!this._fly.active) return;

    const killedAt: Date = this.fly.killedAt;
    const despawnTimeInMilliseconds = this.fly.despawnTime * 1000;
    const millisecondsSinceKilled = new Date().getTime() - killedAt.getTime();

    const hexColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.HexStringToColor("#ffffff"),
      Phaser.Display.Color.HexStringToColor("#ff0000"),
      despawnTimeInMilliseconds,
      millisecondsSinceKilled
    );

    this._fly.setTint(hexColor.color); // TODO THIS DOESN'T WORK OK
  }

  private displayBlood = () => {
    const bloodSplatter = this.scene.add.sprite(this.x, this.y, "fly-squasher-spritesheet", "blood-splatter/0");
    bloodSplatter.play(ANIM_BLOOD_SPLATTER);
    // tint to green
    bloodSplatter.setTint(0x00ff00);
    // set scale
    bloodSplatter.setScale(this.scale);
    this.scene.time.delayedCall(3 * 1000, () => {
      this.scene.tweens.add({
        targets: bloodSplatter,
        alpha: 0,
        duration: 2000,
        onComplete: () => {
          bloodSplatter.destroy();
        }
      });
    });
  };
}
