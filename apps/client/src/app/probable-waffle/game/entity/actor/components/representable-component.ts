import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { onObjectReady } from "../../../data/game-object-helper";

export interface RepresentableDefinition {
  width: number;
  height: number;
}
export class RepresentableComponent {
  private _worldTransform: Vector3Simple = { x: 0, y: 0, z: 0 };
  private _visible: boolean = true;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public representableDefinition: RepresentableDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
  }

  init() {
    this.setTransformInitially();
  }

  private setTransformInitially() {
    const gameObject = this.gameObject;
    if (!gameObject) return;
    const transform = gameObject as unknown as Phaser.GameObjects.Components.Transform;
    if (transform.x !== undefined && transform.y !== undefined) {
      this._worldTransform.x = transform.x;
      this._worldTransform.y = transform.y;
      this._worldTransform.z = transform.z || 0; // Default z to 0 if not defined
    }
  }

  get worldTransform(): Vector3Simple {
    // todo
    return this._worldTransform;
  }
  set worldTransform(worldPosition: Vector3Simple) {
    this._worldTransform = worldPosition;
  }

  get visible(): boolean {
    // todo
    return this._visible;
  }
  get width(): number {
    return this.representableDefinition.width;
  }
  get height(): number {
    return this.representableDefinition.height;
  }
}
