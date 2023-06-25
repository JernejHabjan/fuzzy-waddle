import { IComponent } from '../../../../probable-waffle/game/core/component.service';
import { FlyPrefab } from '../fly-prefab';
import { BaseScene } from '../../../../shared/game/phaser/scene/base.scene';

export class FlyRepresentableComponent implements IComponent {
  private _fly!: FlyPrefab;

  constructor(private readonly scene: BaseScene) {}

  init() {
    this._fly = new FlyPrefab(this.scene);
    this.scene.add.existing(this._fly);
  }

  destroy() {
    this._fly.destroy();
  }

  get width() {
    return this._fly.width;
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
}
