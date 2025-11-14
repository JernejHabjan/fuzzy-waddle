import GameObject = Phaser.GameObjects.GameObject;
import { getGameObjectRenderedTransform, onObjectReady } from "../../data/game-object-helper";
import Phaser from "phaser";
import { HealthComponent } from "./combat/components/health-component";
import { ContainerComponent } from "./building/container-component";

/**
 * OutlineComponent creates a visual outline effect for game objects using Phaser's built-in glow effect.
 * 
 * Supports:
 * - Simple Sprites and Images
 * - Containers with multiple child sprites (for complex animated prefabs)
 * 
 * Based on Rex's advice:
 * - Creates duplicate sprite/image at the top depth
 * - Applies built-in glow effect with knockout parameter
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
    glowFX?: Phaser.FX.Glow;
  }> = [];
  private isVisible: boolean = false;

  constructor(private readonly gameObject: GameObject) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.on(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
    // Subscribe to scene update to keep outline in sync
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
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
    outline.setAlpha(source.alpha ?? 1);
    outline.setFlipX(source.flipX ?? false);
    outline.setFlipY(source.flipY ?? false);

    if (isInContainer && this.outlineContainer) {
      // Add to outline container
      this.outlineContainer.add(outline);
    } else {
      // Set to very high depth for standalone sprites
      outline.setDepth(Number.MAX_SAFE_INTEGER);
    }

    // Apply glow effect
    if (outline.postFX) {
      const glowFX = outline.postFX.addGlow(0xffffff, 4, 0, false, 0.1, 10);
      
      // Make the sprite itself more transparent while keeping the glow visible
      outline.setAlpha(0.3);
      
      // Store the glow FX reference
      const spriteEntry = this.outlineSprites.find(s => s.outline === outline);
      if (spriteEntry) {
        spriteEntry.glowFX = glowFX;
      }
    }
  }

  /**
   * Shows the outline effect
   */
  show() {
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
   * Hides the outline effect
   */
  hide() {
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
   */
  update = () => {
    this.updatePosition();
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
