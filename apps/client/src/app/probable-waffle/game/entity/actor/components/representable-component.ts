import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getGameObjectBoundsRaw, getGameObjectVisibility, onObjectReady } from "../../../data/game-object-helper";

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
   * This is the logical world position of the game object, not the rendered position.
   */
  private _logicalWorldTransform?: Vector3Simple;
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
    if (!this.gameObject) return;
    const transformComponent = this.gameObject as unknown as Phaser.GameObjects.Components.Transform;
    if (transformComponent) {
      this._logicalWorldTransform = {
        x: transformComponent.x ?? 0,
        y: transformComponent.y ?? 0,
        z: transformComponent.z ?? 0 // z component may be assigned in editor itself from prefab properties "z" property
      };
    } else {
      this._logicalWorldTransform = { x: 0, y: 0, z: 0 }; // default to origin if transform is not available
      console.warn("RepresentableComponent: GameObject transform is not available, bounds may not be accurate.");
    }
    this.ensureBoundPrepared();
  }

  private refreshBounds(): void {
    const worldTransform = this._logicalWorldTransform!;
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
  private ensureBoundPrepared() {
    if (this._actorBounds) return;
    const centerRelativeToOrigin = this.renderedWorldTransform;
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
    this.refreshBounds();
  }

  get logicalWorldTransform(): Vector3Simple {
    if (!this._logicalWorldTransform) {
      this.setTransformInitially();
    }
    return this._logicalWorldTransform!;
  }

  set logicalWorldTransform(worldPosition: Vector3Simple) {
    this._logicalWorldTransform = worldPosition;
    this.renderedWorldTransform = {
      x: worldPosition.x,
      y: worldPosition.y - worldPosition.z // adjust y by z offset
    } satisfies Vector2Simple;
    this.ensureBoundPrepared();
    this.refreshBounds();
  }

  private set renderedWorldTransform(worldPosition: Vector2Simple) {
    const transformComponent = this.gameObject as unknown as Phaser.GameObjects.Components.Transform;
    if (!transformComponent.hasTransformComponent) return;
    // Update the game object position based on the new world transform
    transformComponent.x = worldPosition.x;
    transformComponent.y = worldPosition.y;
  }

  get renderedWorldTransform(): Vector2Simple {
    const transform = this.logicalWorldTransform;
    // adjust the y by z offset
    return {
      x: transform.x,
      y: transform.y - transform.z
      // z does not affect rendering in Phaser 3
    };
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
