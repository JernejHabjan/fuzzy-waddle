import type {
  ObjectNames,
  RepresentableComponentData,
  Vector2Simple,
  Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { getGameObjectBounds, getGameObjectVisibility, onObjectReady } from "../../data/game-object-helper";
import { getActorComponent } from "../../data/actor-component";
import { FlyingComponent } from "./movement/flying-component";
import { DepthHelper } from "../../world/services/depth.helper";
import { TilemapComponent } from "../../world/tilemap/tilemap.component";
import type { RepresentableDefinition } from "./representable-definition";
import { pwActorDefinitions } from "../../prefabs/definitions/actor-definitions";
import { environment } from "../../../../../environments/environment";

export class RepresentableComponent {
  /**
   * Center of the game object relative to the origin of the game object.
   * This is the logical world position of the game object, not the rendered position.
   */
  private _logicalWorldTransform?: Vector3Simple;
  private _visible?: boolean;
  private _debugGraphics?: Phaser.GameObjects.Graphics;
  private static readonly drawDebug = true; // todo

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
        // #519 - adjusted by flying height offset so spawned prefab from Phaser Editor gets correct "logical" transform
        // This also fixes an issue where flying units would be weirdly offset from save-game
        y: (transformComponent.y ?? 0) + this.flyingHeightOffset,
        // z component may be assigned in editor itself from prefab properties "z" property
        z: transformComponent.z ?? 0
      };
    } else {
      this.logicalWorldTransform = { x: 0, y: 0, z: 0 }; // default to origin if transform is not available
      console.warn("RepresentableComponent: GameObject transform is not available, bounds may not be accurate.");
    }

    this.drawDebugBounds();
  }

  /**
   * get z + flight height
   */
  getActualLogicalZ(logicalWorldTransform: Vector3Simple): number {
    const logicalZ = logicalWorldTransform.z;
    return logicalZ + this.flyingHeightOffset;
  }

  private get flyingHeightOffset() {
    const flightDefinition = getActorComponent(this.gameObject, FlyingComponent)?.flightDefinition;
    if (!flightDefinition) return 0;
    return flightDefinition.height + TilemapComponent.tileWidth / 2;
  }

  /**
   * Get the flying height component only (in pixels).
   * Returns the additional height from flying, not including base Z.
   */
  get flyingHeightPixels(): number {
    return this.getActualLogicalZ(this.logicalWorldTransform) - this.logicalWorldTransform.z;
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

    this.drawDebugBounds();
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

  setData(data: Partial<RepresentableComponentData>) {
    if (data.logicalWorldTransform) {
      this.logicalWorldTransform = data.logicalWorldTransform;
    }
  }

  getData(): RepresentableComponentData {
    return {
      logicalWorldTransform: this.logicalWorldTransform
    } satisfies RepresentableComponentData;
  }

  /**
   * Draws debug visualization showing the bounds box and origin point of this game object.
   * The bounds box is drawn in green, and the origin point is drawn as a red dot.
   */
  drawDebugBounds(): void {
    if (environment.production || !RepresentableComponent.drawDebug) return;
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) {
      console.warn("RepresentableComponent: Could not get bounds for debug drawing");
      return;
    }

    const origin = pwActorDefinitions[this.gameObject.name as ObjectNames]?.components?.representable?.origin;
    if (!origin) {
      console.warn("RepresentableComponent: Could not get origin for debug drawing");
      return;
    }

    // Create graphics object if it doesn't exist
    if (!this._debugGraphics) {
      this._debugGraphics = this.gameObject.scene.add.graphics();
      this._debugGraphics.setDepth(10000); // Draw on top
    }

    // Clear previous drawing
    this._debugGraphics.clear();

    // Draw bounds rectangle in green
    this._debugGraphics.lineStyle(2, 0x00ff00, 1);
    this._debugGraphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Draw origin point as a red dot
    const originX = bounds.x + bounds.width * origin.x;
    const originY = bounds.y + bounds.height * origin.y;
    this._debugGraphics.fillStyle(0xff0000, 1);
    this._debugGraphics.fillCircle(originX, originY, 4);

    // Draw crosshair at origin
    this._debugGraphics.lineStyle(1, 0xff0000, 1);
    this._debugGraphics.beginPath();
    this._debugGraphics.moveTo(originX - 8, originY);
    this._debugGraphics.lineTo(originX + 8, originY);
    this._debugGraphics.moveTo(originX, originY - 8);
    this._debugGraphics.lineTo(originX, originY + 8);
    this._debugGraphics.strokePath();
  }

  /**
   * Clears the debug bounds visualization.
   */
  clearDebugBounds(): void {
    if (this._debugGraphics) {
      this._debugGraphics.destroy();
      this._debugGraphics = undefined;
    }
  }
}
