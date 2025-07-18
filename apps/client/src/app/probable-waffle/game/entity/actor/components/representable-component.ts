import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import {
  getGameObjectBoundsRaw,
  getGameObjectRenderedTransformRaw,
  getGameObjectVisibility,
  onObjectReady
} from "../../../data/game-object-helper";
import { getActorComponent } from "../../../data/actor-component";
import { FlightComponent } from "./flight-component";
import { DepthHelper } from "../../../world/map/depth.helper";
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
  private initialBounds?: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  };

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
      this.logicalWorldTransform = {
        x: transformComponent.x ?? 0,
        y: transformComponent.y ?? 0,
        z: transformComponent.z ?? 0 // z component may be assigned in editor itself from prefab properties "z" property
      };
    } else {
      this.logicalWorldTransform = { x: 0, y: 0, z: 0 }; // default to origin if transform is not available
      console.warn("RepresentableComponent: GameObject transform is not available, bounds may not be accurate.");
    }
    this.ensureInitialBounds();
    this.refreshBounds();
  }

  private refreshBounds(): void {
    if (!this.initialBounds) return;
    const renderedTransform = this.renderedWorldTransform;
    const scaleX = (this.gameObject as any).scaleX ?? 1;
    const scaleY = (this.gameObject as any).scaleY ?? 1;

    this.bounds = new Phaser.Geom.Rectangle(
      renderedTransform.x + this.initialBounds.offsetX * scaleX,
      renderedTransform.y + this.initialBounds.offsetY * scaleY,
      this.initialBounds.width * scaleX,
      this.initialBounds.height * scaleY
    );
  }

  private ensureInitialBounds() {
    if (this.initialBounds) return;
    const bounds = getGameObjectBoundsRaw(this.gameObject);
    if (!bounds) {
      console.warn("Could not get initial bounds for", this.gameObject);
      this.initialBounds = {
        width: this.representableDefinition.width,
        height: this.representableDefinition.height,
        offsetX: -this.representableDefinition.width * 0.5,
        offsetY: -this.representableDefinition.height * 0.5
      };
      return;
    }

    const transform = getGameObjectRenderedTransformRaw(this.gameObject)!;

    this.initialBounds = {
      width: bounds.width,
      height: bounds.height,
      offsetX: bounds.x - transform.x,
      offsetY: bounds.y - transform.y
    };
  }

  /**
   * get z + flight height
   */
  getActualLogicalZ(logicalWorldTransform: Vector3Simple): number {
    const logicalZ = logicalWorldTransform.z;
    const flightHeight = getActorComponent(this.gameObject, FlightComponent)?.flightDefinition?.height ?? 0;
    return logicalZ + flightHeight;
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
      y: worldPosition.y - this.getActualLogicalZ(worldPosition) // adjust y by z offset
    } satisfies Vector2Simple;
    this.ensureInitialBounds();
    this.refreshBounds();
  }

  private set renderedWorldTransform(worldPosition: Vector2Simple) {
    const transformComponent = this.gameObject as unknown as Phaser.GameObjects.Components.Transform;
    if (!transformComponent.hasTransformComponent) return;
    // Update the game object position based on the new world transform
    transformComponent.x = worldPosition.x;
    transformComponent.y = worldPosition.y;
    DepthHelper.setActorDepth(this.gameObject);
  }

  get renderedWorldTransform(): Vector2Simple {
    const transform = this.logicalWorldTransform;
    // adjust the y by z offset
    return {
      x: transform.x,
      y: transform.y - this.getActualLogicalZ(transform)
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
