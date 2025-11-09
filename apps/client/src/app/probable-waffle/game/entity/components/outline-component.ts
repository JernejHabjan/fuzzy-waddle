import GameObject = Phaser.GameObjects.GameObject;
import { getGameObjectRenderedTransform, onObjectReady } from "../../data/game-object-helper";
import Phaser from "phaser";
import { HealthComponent } from "./combat/components/health-component";
import { ContainerComponent } from "./building/container-component";

/**
 * OutlineComponent creates a visual outline effect for game objects using Phaser's built-in glow effect.
 * 
 * Based on Rex's advice:
 * - Creates a duplicate sprite/image at the top depth
 * - Applies built-in glow effect with knockout parameter
 * - Ensures outline is visible even when actor is behind other objects
 * 
 * Implementation inspired by:
 * - https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-builtin/#glow
 * - https://codepen.io/rexrainbow/pen/dyGNrqa
 */
export class OutlineComponent {
  private outlineSprite?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  private glowFX?: Phaser.FX.Glow;
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
   * Creates the outline sprite with glow effect.
   * The sprite is created at a very high depth to ensure it's always visible on top.
   */
  private createOutlineSprite() {
    if (this.outlineSprite) return;

    const transform = getGameObjectRenderedTransform(this.gameObject);
    if (!transform || transform.x === undefined || transform.y === undefined) return;

    // Determine the type and get the texture/frame
    let texture: string | undefined;
    let frame: string | number | undefined;

    if (this.gameObject instanceof Phaser.GameObjects.Sprite) {
      texture = this.gameObject.texture.key;
      frame = this.gameObject.frame.name;
      
      // Create sprite duplicate
      this.outlineSprite = this.gameObject.scene.add.sprite(transform.x, transform.y, texture, frame);
      
      // Copy animation state if playing
      if (this.gameObject.anims && this.gameObject.anims.currentAnim) {
        this.outlineSprite.play(this.gameObject.anims.currentAnim.key);
        this.outlineSprite.anims.setProgress(this.gameObject.anims.getProgress());
      }
    } else if (this.gameObject instanceof Phaser.GameObjects.Image) {
      texture = this.gameObject.texture.key;
      frame = this.gameObject.frame.name;
      
      // Create image duplicate
      this.outlineSprite = this.gameObject.scene.add.image(transform.x, transform.y, texture, frame);
    } else {
      // For other game object types (like containers), we can't create a simple outline
      console.warn("OutlineComponent: Unsupported game object type for outline", this.gameObject);
      return;
    }

    if (!this.outlineSprite) return;

    // Copy transform properties
    this.outlineSprite.setOrigin(
      (this.gameObject as Phaser.GameObjects.Sprite).originX ?? 0.5,
      (this.gameObject as Phaser.GameObjects.Sprite).originY ?? 0.5
    );
    this.outlineSprite.setScale(
      (this.gameObject as Phaser.GameObjects.Sprite).scaleX ?? 1,
      (this.gameObject as Phaser.GameObjects.Sprite).scaleY ?? 1
    );
    this.outlineSprite.setRotation((this.gameObject as Phaser.GameObjects.Sprite).rotation ?? 0);
    this.outlineSprite.setAlpha((this.gameObject as Phaser.GameObjects.Sprite).alpha ?? 1);
    this.outlineSprite.setFlipX((this.gameObject as Phaser.GameObjects.Sprite).flipX ?? false);
    this.outlineSprite.setFlipY((this.gameObject as Phaser.GameObjects.Sprite).flipY ?? false);

    // Set to very high depth to be on top of everything
    this.outlineSprite.setDepth(Number.MAX_SAFE_INTEGER);

    // Apply glow effect with knockout
    if (this.outlineSprite.postFX) {
      this.glowFX = this.outlineSprite.postFX.addGlow(0xffffff, 4, 0, false, 0.1, 10);
      
      // Set knockout to true so only the outline/glow is visible, not the sprite itself
      // Note: In Phaser 4, knockout might work differently. We'll use alpha blending instead.
      // Make the sprite itself more transparent while keeping the glow visible
      this.outlineSprite.setAlpha(0.3);
    }

    this.outlineSprite.setVisible(this.isVisible);
  }

  /**
   * Shows the outline effect
   */
  show() {
    if (!this.outlineSprite) {
      this.createOutlineSprite();
    }
    this.isVisible = true;
    if (this.outlineSprite) {
      this.outlineSprite.setVisible(true);
      this.updatePosition();
    }
  }

  /**
   * Hides the outline effect
   */
  hide() {
    this.isVisible = false;
    if (this.outlineSprite) {
      this.outlineSprite.setVisible(false);
    }
  }

  /**
   * Updates the outline sprite position to match the game object
   */
  private updatePosition() {
    if (!this.outlineSprite || !this.isVisible) return;

    const transform = getGameObjectRenderedTransform(this.gameObject);
    if (!transform || transform.x === undefined || transform.y === undefined) return;

    this.outlineSprite.setPosition(transform.x, transform.y);

    // Update animation if it's a sprite
    if (
      this.gameObject instanceof Phaser.GameObjects.Sprite &&
      this.outlineSprite instanceof Phaser.GameObjects.Sprite
    ) {
      if (this.gameObject.anims && this.gameObject.anims.currentAnim) {
        const currentAnimKey = this.gameObject.anims.currentAnim.key;
        
        // Only update if animation changed or not playing
        if (!this.outlineSprite.anims.isPlaying || this.outlineSprite.anims.currentAnim?.key !== currentAnimKey) {
          this.outlineSprite.play(currentAnimKey);
        }
        
        // Sync animation progress
        this.outlineSprite.anims.setProgress(this.gameObject.anims.getProgress());
      }

      // Update flip state
      this.outlineSprite.setFlipX(this.gameObject.flipX);
      this.outlineSprite.setFlipY(this.gameObject.flipY);
    }

    // Update rotation and scale
    if (this.gameObject instanceof Phaser.GameObjects.Sprite || this.gameObject instanceof Phaser.GameObjects.Image) {
      this.outlineSprite.setRotation(this.gameObject.rotation);
      this.outlineSprite.setScale(this.gameObject.scaleX, this.gameObject.scaleY);
    }
  }

  /**
   * Update method called on each frame to sync outline with game object
   */
  update = () => {
    this.updatePosition();
  };

  private gameObjectVisibilityChanged(visible: boolean) {
    if (!this.outlineSprite) return;
    if (this.isVisible) {
      this.outlineSprite.setVisible(visible);
    }
  }

  private destroy = () => {
    this.hide();
    if (this.outlineSprite) {
      this.outlineSprite.destroy();
      this.outlineSprite = undefined;
    }
    this.glowFX = undefined;
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.gameObject.off(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
  };
}
