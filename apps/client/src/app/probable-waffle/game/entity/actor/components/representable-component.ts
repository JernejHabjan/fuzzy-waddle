import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import {
  getGameObjectBoundsRaw,
  getGameObjectTransformRaw,
  getGameObjectVisibility
} from "../../../data/game-object-helper";

export interface RepresentableDefinition {
  width: number;
  height: number;
}
export class RepresentableComponent {
  /**
   * Center of the game object relative to the origin of the game object.
   */
  private _worldTransform?: Vector3Simple;
  private _visible?: boolean;
  bounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public representableDefinition: RepresentableDefinition
  ) {}

  private setTransformInitially() {
    const gameObject = this.gameObject;
    if (!gameObject) return;
    const transform = getGameObjectTransformRaw(gameObject);
    if (transform) {
      this._worldTransform = transform;
      this.refreshBounds();
    } else {
      this._worldTransform = { x: 0, y: 0, z: 0 }; // default to origin if transform is not available
      console.warn("RepresentableComponent: GameObject transform is not available, bounds may not be accurate.");
      this.refreshBounds(); // still refresh bounds to set initial values
    }
  }

  private refreshBounds() {
    // we need to obtain x, y from the game object bounds because worldTransform may represent center of the object (relative to the origin)
    const gameObjectBounds = getGameObjectBoundsRaw(this.gameObject);
    if (!gameObjectBounds) return;
    const { x, y } = gameObjectBounds;
    this.bounds = new Phaser.Geom.Rectangle(
      x,
      y,
      this.representableDefinition.width,
      this.representableDefinition.height
    );
  }

  get worldTransform(): Vector3Simple {
    if (!this._worldTransform) {
      this.setTransformInitially();
    }
    return this._worldTransform!;
  }
  set worldTransform(worldPosition: Vector3Simple) {
    this._worldTransform = worldPosition;

    const transform = getGameObjectTransformRaw(this.gameObject);
    if (!transform) throw new Error("RepresentableComponent: GameObject transform is not available.");
    // Update the game object position based on the new world transform
    transform.x = worldPosition.x;
    transform.y = worldPosition.y;
    if (worldPosition.z !== undefined) {
      transform.z = worldPosition.z; // if z is defined, update it as well
    }

    this.refreshBounds();
  }

  get visible(): boolean {
    if (!this._visible) {
      const visibility = getGameObjectVisibility(this.gameObject);
      if (visibility) {
        this._visible = visibility.visible;
      } else {
        this._visible = true; // default to true if visibility component is not found
        console.warn(
          "RepresentableComponent: GameObject visibility component is not available, defaulting to visible."
        );
      }
    }
    return this._visible;
  }
  get width(): number {
    return this.representableDefinition.width;
  }
  get height(): number {
    return this.representableDefinition.height;
  }
}
