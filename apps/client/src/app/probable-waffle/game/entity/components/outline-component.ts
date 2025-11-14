import GameObject = Phaser.GameObjects.GameObject;
import { getGameObjectDepth, getGameObjectRenderedTransform, onObjectReady } from "../../data/game-object-helper";
import Phaser from "phaser";
import { HealthComponent } from "./combat/components/health-component";
import { ContainerComponent } from "./building/container-component";

/**
 * OutlineComponent creates a visual outline effect for game objects.
 *
 * Performance Optimizations:
 * - Only renders outline when actor is occluded (behind other objects)
 * - Lazy creation of outline sprites (created only when needed)
 * - Conditional frame updates (only when visible and selected)
 * - Uses simple tint/blend mode instead of expensive GPU filters
 * - Periodic occlusion checks (every 10 frames) instead of every frame
 *
 * Supports:
 * - Simple Sprites and Images
 * - Containers with multiple child sprites (for complex animated prefabs)
 *
 * Based on Rex's advice:
 * - Creates duplicate sprite/image at the top depth
 * - Ensures outline is visible even when actor is behind other objects
 *
 * Implementation inspired by:
 * - https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-builtin/#glow
 * - https://codepen.io/rexrainbow/pen/dyGNrqa
 */
export class OutlineComponent {
  private outlineContainer?: Phaser.GameObjects.Container;
  private outlineSprites: Array<{
    outline: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
    source: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  }> = [];
  private isVisible: boolean = false;
  private isSelected: boolean = false;
  private occlusionCheckCounter: number = 0;
  private readonly occlusionCheckInterval: number = 10; // Check every 10 frames for performance
  private selectionCircle?: Phaser.GameObjects.Graphics; // Reference to ignore in occlusion checks

  constructor(private readonly gameObject: GameObject) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.on(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
    // Subscribe to scene update to keep outline in sync (only when selected and visible)
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  /**
   * Sets the selection circle reference to ignore in occlusion checks
   */
  setSelectionCircle(selectionCircle: Phaser.GameObjects.Graphics) {
    this.selectionCircle = selectionCircle;
  }

  private init = () => {
    // Component is initialized, outline will be created when needed
  };

  /**
   * Creates the outline sprite(s) with glow effect.
   * For containers, creates outline sprites for all child sprites.
   * For simple sprites/images, creates a single outline sprite.
   * The sprites are created at a very high depth to ensure they're always visible on top.
   */
  private createOutlineSprite() {
    if (this.outlineSprites.length > 0) return;

    const transform = getGameObjectRenderedTransform(this.gameObject);
    if (!transform || transform.x === undefined || transform.y === undefined) return;

    if (this.gameObject instanceof Phaser.GameObjects.Container) {
      // Handle containers with multiple sprites
      this.createContainerOutline(transform);
    } else if (this.gameObject instanceof Phaser.GameObjects.Sprite) {
      // Handle single sprite
      this.createSpriteOutline(this.gameObject, transform);
    } else if (this.gameObject instanceof Phaser.GameObjects.Image) {
      // Handle single image
      this.createImageOutline(this.gameObject, transform);
    } else {
      console.warn("OutlineComponent: Unsupported game object type for outline", this.gameObject);
      return;
    }

    // Set visibility for all created outlines
    this.outlineSprites.forEach(({ outline }) => {
      outline.setVisible(this.isVisible);
    });
  }

  /**
   * Creates outline for a container by duplicating all child sprites
   */
  private createContainerOutline(containerTransform: { x: number; y: number }) {
    const container = this.gameObject as Phaser.GameObjects.Container;

    // Create a container to hold all outline sprites at high depth
    this.outlineContainer = this.gameObject.scene.add.container(containerTransform.x, containerTransform.y);
    this.outlineContainer.setDepth(Number.MAX_SAFE_INTEGER);

    // Iterate through all children and create outlines for sprites/images
    container.each((child: GameObject) => {
      if (child instanceof Phaser.GameObjects.Sprite) {
        const childTransform = this.getChildWorldTransform(child, container);
        this.createSpriteOutline(child, childTransform, true);
      } else if (child instanceof Phaser.GameObjects.Image) {
        const childTransform = this.getChildWorldTransform(child, container);
        this.createImageOutline(child, childTransform, true);
      }
    });
  }

  /**
   * Gets the world transform of a child relative to its container
   */
  private getChildWorldTransform(
    child: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    container: Phaser.GameObjects.Container
  ): { x: number; y: number } {
    // Child position is relative to container, so we use the child's local position
    return { x: child.x, y: child.y };
  }

  /**
   * Creates an outline for a single sprite
   */
  private createSpriteOutline(
    sourceSprite: Phaser.GameObjects.Sprite,
    transform: { x: number; y: number },
    isInContainer: boolean = false
  ) {
    const texture = sourceSprite.texture.key;
    const frame = sourceSprite.frame.name;

    // Create sprite duplicate
    const outlineSprite = this.gameObject.scene.add.sprite(transform.x, transform.y, texture, frame);

    // Copy animation state if playing
    if (sourceSprite.anims && sourceSprite.anims.currentAnim) {
      outlineSprite.play(sourceSprite.anims.currentAnim.key);
      outlineSprite.anims.setProgress(sourceSprite.anims.getProgress());
    }

    this.setupOutlineSprite(outlineSprite, sourceSprite, isInContainer);
    this.outlineSprites.push({ outline: outlineSprite, source: sourceSprite });
  }

  /**
   * Creates an outline for a single image
   */
  private createImageOutline(
    sourceImage: Phaser.GameObjects.Image,
    transform: { x: number; y: number },
    isInContainer: boolean = false
  ) {
    const texture = sourceImage.texture.key;
    const frame = sourceImage.frame.name;

    // Create image duplicate
    const outlineImage = this.gameObject.scene.add.image(transform.x, transform.y, texture, frame);

    this.setupOutlineSprite(outlineImage, sourceImage, isInContainer);
    this.outlineSprites.push({ outline: outlineImage, source: sourceImage });
  }

  /**
   * Sets up common properties for outline sprites
   * Performance optimization: Uses simple tint instead of expensive GPU filters
   */
  private setupOutlineSprite(
    outline: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    source: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    isInContainer: boolean
  ) {
    // Copy transform properties
    outline.setOrigin(source.originX ?? 0.5, source.originY ?? 0.5);
    outline.setScale(source.scaleX ?? 1, source.scaleY ?? 1);
    outline.setRotation(source.rotation ?? 0);
    outline.setFlipX(source.flipX ?? false);
    outline.setFlipY(source.flipY ?? false);

    if (isInContainer && this.outlineContainer) {
      // Add to outline container
      this.outlineContainer.add(outline);
    } else {
      // Set to very high depth for standalone sprites
      outline.setDepth(Number.MAX_SAFE_INTEGER);
    }

    // Performance optimization: Use simple tint/alpha instead of expensive GPU filters
    // This creates a subtle outline effect without the performance cost of filters
    outline.setTint(0x00ffff); // Cyan tint for visibility
    outline.setAlpha(0.6); // Semi-transparent for outline effect
    outline.setBlendMode(Phaser.BlendModes.ADD); // Additive blend for glow-like effect

    this.outlineSprites.push({ outline, source });
  }

  /**
   * Shows the outline effect (only if actor is occluded)
   */
  show() {
    this.isSelected = true;
    // Don't create sprites yet - wait for occlusion check
    this.checkAndUpdateOcclusion();
  }

  /**
   * Hides the outline effect
   */
  hide() {
    this.isSelected = false;
    this.hideOutlineSprites();
  }

  /**
   * Checks if the game object is occluded (behind other objects)
   * Only shows outline if occluded
   */
  private checkAndUpdateOcclusion() {
    if (!this.isSelected) return;

    const isOccluded = this.isGameObjectOccluded();

    if (isOccluded && !this.isVisible) {
      // Actor is occluded and outline not visible - show it
      this.showOutlineSprites();
    } else if (!isOccluded && this.isVisible) {
      // Actor is not occluded but outline is visible - hide it
      this.hideOutlineSprites();
    }
  }

  /**
   * Checks if the game object is occluded by other objects with higher depth
   * Uses interactive hit areas when available for more accurate detection (ignores transparency)
   */
  private isGameObjectOccluded(): boolean {
    // Get the depth of the current game object
    const myDepth = getGameObjectDepth(this.gameObject) ?? 0;
    const myGeometry = this.getGameObjectGeometry();

    if (!myGeometry) return false;

    // Get all display objects in the scene
    const displayList = this.gameObject.scene.children.list;

    // Check if any object with higher depth overlaps with this object
    for (const obj of displayList) {
      if (obj === this.gameObject) continue;
      if (obj === this.selectionCircle) continue; // Ignore selection circle
      if (obj === this.outlineContainer) continue; // Ignore our own outline

      // Check if this object has higher depth (in front)
      const objDepth = (obj as any).depth ?? 0;
      if (objDepth <= myDepth) continue;

      // Check for overlap using hit areas if available
      const otherGeometry = this.getObjectGeometry(obj);
      if (!otherGeometry) continue;

      if (this.geometryOverlaps(myGeometry, otherGeometry)) {
        return true; // Found an overlapping object with higher depth
      }
    }

    return false;
  }

  /**
   * Gets geometry of the game object (hit area if available, otherwise bounds)
   * Hit areas are more accurate as they ignore transparent pixels
   */
  private getGameObjectGeometry(): any {
    // Try to use hit area from interactive input first
    const input = (this.gameObject as any).input;
    if (input && input.hitArea) {
      const hitArea = input.hitArea;
      const transform = getGameObjectRenderedTransform(this.gameObject);
      
      if (!transform) return null;
      
      // Return geometry with type and position
      if (hitArea instanceof Phaser.Geom.Circle) {
        return {
          type: 'circle',
          geometry: new Phaser.Geom.Circle(
            transform.x + hitArea.x,
            transform.y + hitArea.y,
            hitArea.radius
          )
        };
      } else if (hitArea instanceof Phaser.Geom.Polygon) {
        // Clone and offset polygon points to world position
        const points = hitArea.points.map((p: any) => ({
          x: p.x + transform.x,
          y: p.y + transform.y
        }));
        return {
          type: 'polygon',
          geometry: new Phaser.Geom.Polygon(points)
        };
      } else if (hitArea instanceof Phaser.Geom.Rectangle) {
        return {
          type: 'rectangle',
          geometry: new Phaser.Geom.Rectangle(
            transform.x + hitArea.x,
            transform.y + hitArea.y,
            hitArea.width,
            hitArea.height
          )
        };
      }
    }

    // Fallback to bounds for non-interactive objects
    return this.getGeometryFromBounds(this.gameObject);
  }

  /**
   * Gets geometry of any display object (hit area if available, otherwise bounds)
   */
  private getObjectGeometry(obj: any): any {
    // Try to use hit area from interactive input first
    const input = obj.input;
    if (input && input.hitArea) {
      const hitArea = input.hitArea;
      const x = obj.x ?? 0;
      const y = obj.y ?? 0;
      
      // Return geometry with type and position
      if (hitArea instanceof Phaser.Geom.Circle) {
        return {
          type: 'circle',
          geometry: new Phaser.Geom.Circle(x + hitArea.x, y + hitArea.y, hitArea.radius)
        };
      } else if (hitArea instanceof Phaser.Geom.Polygon) {
        const points = hitArea.points.map((p: any) => ({
          x: p.x + x,
          y: p.y + y
        }));
        return {
          type: 'polygon',
          geometry: new Phaser.Geom.Polygon(points)
        };
      } else if (hitArea instanceof Phaser.Geom.Rectangle) {
        return {
          type: 'rectangle',
          geometry: new Phaser.Geom.Rectangle(x + hitArea.x, y + hitArea.y, hitArea.width, hitArea.height)
        };
      }
    }

    // Fallback to bounds
    return this.getGeometryFromBounds(obj);
  }

  /**
   * Gets rectangle geometry from object bounds (fallback)
   */
  private getGeometryFromBounds(obj: any): any {
    try {
      if (obj.getBounds && typeof obj.getBounds === 'function') {
        const bounds = obj.getBounds();
        return {
          type: 'rectangle',
          geometry: new Phaser.Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height)
        };
      }
    } catch (e) {
      // Bounds not available
    }
    return null;
  }

  /**
   * Checks if two geometries overlap
   * Handles different geometry type combinations (Circle, Polygon, Rectangle)
   */
  private geometryOverlaps(a: any, b: any): boolean {
    if (!a || !b) return false;

    const typeA = a.type;
    const typeB = b.type;
    const geomA = a.geometry;
    const geomB = b.geometry;

    // Circle vs Circle
    if (typeA === 'circle' && typeB === 'circle') {
      const distance = Phaser.Math.Distance.Between(geomA.x, geomA.y, geomB.x, geomB.y);
      return distance < (geomA.radius + geomB.radius);
    }

    // Rectangle vs Rectangle
    if (typeA === 'rectangle' && typeB === 'rectangle') {
      return Phaser.Geom.Rectangle.Overlaps(geomA, geomB);
    }

    // Circle vs Rectangle
    if ((typeA === 'circle' && typeB === 'rectangle') || (typeA === 'rectangle' && typeB === 'circle')) {
      const circle = typeA === 'circle' ? geomA : geomB;
      const rect = typeA === 'rectangle' ? geomA : geomB;
      return Phaser.Geom.Intersects.CircleToRectangle(circle, rect);
    }

    // Polygon vs Rectangle
    if ((typeA === 'polygon' && typeB === 'rectangle') || (typeA === 'rectangle' && typeB === 'polygon')) {
      const polygon = typeA === 'polygon' ? geomA : geomB;
      const rect = typeA === 'rectangle' ? geomA : geomB;
      return Phaser.Geom.Intersects.RectangleToTriangle(rect, polygon) ||
             this.polygonContainsRectangle(polygon, rect);
    }

    // Polygon vs Circle
    if ((typeA === 'polygon' && typeB === 'circle') || (typeA === 'circle' && typeB === 'polygon')) {
      const polygon = typeA === 'polygon' ? geomA : geomB;
      const circle = typeA === 'circle' ? geomA : geomB;
      // Check if circle center is in polygon or if circle intersects polygon edges
      return Phaser.Geom.Polygon.Contains(polygon, circle.x, circle.y) ||
             this.circleIntersectsPolygon(circle, polygon);
    }

    // Polygon vs Polygon
    if (typeA === 'polygon' && typeB === 'polygon') {
      // Check if any point of polygon A is inside polygon B or vice versa
      for (const point of geomA.points) {
        if (Phaser.Geom.Polygon.Contains(geomB, point.x, point.y)) {
          return true;
        }
      }
      for (const point of geomB.points) {
        if (Phaser.Geom.Polygon.Contains(geomA, point.x, point.y)) {
          return true;
        }
      }
      return false;
    }

    // Fallback: convert both to rectangles and check overlap
    return false;
  }

  /**
   * Helper: Check if polygon contains any corner of rectangle
   */
  private polygonContainsRectangle(polygon: Phaser.Geom.Polygon, rect: Phaser.Geom.Rectangle): boolean {
    return Phaser.Geom.Polygon.Contains(polygon, rect.x, rect.y) ||
           Phaser.Geom.Polygon.Contains(polygon, rect.right, rect.y) ||
           Phaser.Geom.Polygon.Contains(polygon, rect.x, rect.bottom) ||
           Phaser.Geom.Polygon.Contains(polygon, rect.right, rect.bottom);
  }

  /**
   * Helper: Check if circle intersects with polygon edges
   */
  private circleIntersectsPolygon(circle: Phaser.Geom.Circle, polygon: Phaser.Geom.Polygon): boolean {
    const points = polygon.points;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const line = new Phaser.Geom.Line(p1.x, p1.y, p2.x, p2.y);
      if (Phaser.Geom.Intersects.LineToCircle(line, circle)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Shows the outline sprites
   */
  private showOutlineSprites() {
    if (this.outlineSprites.length === 0) {
      this.createOutlineSprite();
    }
    this.isVisible = true;

    if (this.outlineContainer) {
      this.outlineContainer.setVisible(true);
    }

    this.outlineSprites.forEach(({ outline }) => {
      outline.setVisible(true);
    });

    this.updatePosition();
  }

  /**
   * Hides the outline sprites
   */
  private hideOutlineSprites() {
    this.isVisible = false;

    if (this.outlineContainer) {
      this.outlineContainer.setVisible(false);
    }

    this.outlineSprites.forEach(({ outline }) => {
      outline.setVisible(false);
    });
  }

  /**
   * Updates the outline sprite(s) position to match the game object
   */
  private updatePosition() {
    if (this.outlineSprites.length === 0 || !this.isVisible) return;

    const transform = getGameObjectRenderedTransform(this.gameObject);
    if (!transform || transform.x === undefined || transform.y === undefined) return;

    if (this.gameObject instanceof Phaser.GameObjects.Container) {
      // Update container position
      if (this.outlineContainer) {
        this.outlineContainer.setPosition(transform.x, transform.y);
      }

      // Update each child outline sprite
      this.outlineSprites.forEach(({ outline, source }) => {
        this.updateSpriteOutline(outline, source);
      });
    } else {
      // Update single sprite/image outline
      const { outline, source } = this.outlineSprites[0]!;
      outline.setPosition(transform.x, transform.y);
      this.updateSpriteOutline(outline, source);
    }
  }

  /**
   * Updates a single outline sprite to match its source
   */
  private updateSpriteOutline(
    outline: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
    source: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image
  ) {
    // Update animation if it's a sprite
    if (source instanceof Phaser.GameObjects.Sprite && outline instanceof Phaser.GameObjects.Sprite) {
      if (source.anims && source.anims.currentAnim) {
        const currentAnimKey = source.anims.currentAnim.key;

        // Only update if animation changed or not playing
        if (!outline.anims.isPlaying || outline.anims.currentAnim?.key !== currentAnimKey) {
          outline.play(currentAnimKey);
        }

        // Sync animation progress
        outline.anims.setProgress(source.anims.getProgress());
      }

      // Update flip state
      outline.setFlipX(source.flipX);
      outline.setFlipY(source.flipY);
    }

    // Update rotation and scale
    outline.setRotation(source.rotation);
    outline.setScale(source.scaleX, source.scaleY);
  }

  /**
   * Update method called on each frame to sync outline with game object
   * Performance optimization: Only updates when selected and visible
   * Performs occlusion check periodically (every N frames)
   */
  update = () => {
    if (!this.isSelected) return; // Skip if not selected

    // Perform occlusion check periodically for performance
    this.occlusionCheckCounter++;
    if (this.occlusionCheckCounter >= this.occlusionCheckInterval) {
      this.occlusionCheckCounter = 0;
      this.checkAndUpdateOcclusion();
    }

    // Only update position if outline is visible
    if (this.isVisible) {
      this.updatePosition();
    }
  };

  private gameObjectVisibilityChanged(visible: boolean) {
    if (!this.isVisible) return;

    if (this.outlineContainer) {
      this.outlineContainer.setVisible(visible);
    }

    this.outlineSprites.forEach(({ outline }) => {
      outline.setVisible(visible);
    });
  }

  private destroy = () => {
    this.hide();

    // Destroy all outline sprites
    this.outlineSprites.forEach(({ outline }) => {
      outline.destroy();
    });
    this.outlineSprites = [];

    // Destroy outline container if it exists
    if (this.outlineContainer) {
      this.outlineContainer.destroy();
      this.outlineContainer = undefined;
    }

    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.gameObject.off(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
  };
}
