import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import {
  getGameObjectBoundsRaw,
  getGameObjectTransformRaw,
  getGameObjectVisibility,
  onObjectReady
} from "../../../data/game-object-helper";

interface ActorInitialBounds {
  topLeft: Vector2Simple;
  topRight: Vector2Simple;
  bottomLeft: Vector2Simple;
  bottomRight: Vector2Simple;
}

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
  private _actorBounds?: ActorInitialBounds;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public representableDefinition: RepresentableDefinition
  ) {
    onObjectReady(gameObject, this.setTransformInitially, this);
  }

  private setTransformInitially() {
    const gameObject = this.gameObject;
    if (!gameObject) return;
    const transform = getGameObjectTransformRaw(gameObject);
    if (transform) {
      this._worldTransform = transform;
    } else {
      this._worldTransform = { x: 0, y: 0, z: 0 }; // default to origin if transform is not available
      console.warn("RepresentableComponent: GameObject transform is not available, bounds may not be accurate.");
    }
    this.setActorInitialBounds();
    this.refreshBounds();
  }

  private refreshBounds(): void {
    const worldTransform = this._worldTransform!;
    const initialBounds = this._actorBounds!;
    const scaleX = (this.gameObject as any).scaleX ?? 1;
    const scaleY = (this.gameObject as any).scaleY ?? 1;
    const originX = (this.gameObject as any).originX ?? 0.5;
    const height = this.representableDefinition.height;
    const width = this.representableDefinition.width;

    this.bounds = new Phaser.Geom.Rectangle(
      worldTransform.x - width * originX * scaleX, // Center horizontally with scale
      worldTransform.y + initialBounds.topLeft.y * scaleY, // Preserve initial vertical offset, scaled
      width * scaleX,
      height * scaleY
    );
  }

  /**
   * We need to store actors initial bounds, as bounds may change during animation playback due to different sprite dimensions.
   * See #374 for more details.
   */
  private setActorInitialBounds() {
    const centerRelativeToOrigin = this.worldTransform;
    const bounds = getGameObjectBoundsRaw(this.gameObject);
    if (!bounds) throw new Error("RepresentableComponent: GameObject bounds are not available.");

    const topLeft = {
      x: bounds.x - centerRelativeToOrigin.x,
      y: bounds.y - centerRelativeToOrigin.y
    };
    const topRight = {
      x: bounds.right - centerRelativeToOrigin.x,
      y: bounds.y - centerRelativeToOrigin.y
    };
    const bottomLeft = {
      x: bounds.x - centerRelativeToOrigin.x,
      y: bounds.bottom - centerRelativeToOrigin.y
    };
    const bottomRight = {
      x: bounds.right - centerRelativeToOrigin.x,
      y: bounds.bottom - centerRelativeToOrigin.y
    };

    this._actorBounds = {
      topLeft,
      topRight,
      bottomLeft,
      bottomRight
    } satisfies ActorInitialBounds;
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
    if (this._visible === undefined) {
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
}
