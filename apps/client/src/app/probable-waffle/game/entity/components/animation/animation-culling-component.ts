import { getActorComponent } from "../../../data/actor-component";
import { AnimationActorComponent } from "./animation-actor-component";
import { onObjectReady } from "../../../data/game-object-helper";
import { HealthComponent } from "../combat/components/health-component";

/**
 * Component that pauses animations for actors outside the camera viewport to improve performance.
 * This component checks periodically if the actor is visible in the camera and pauses/resumes
 * animations accordingly.
 */
export class AnimationCullingComponent {
  private animationComponent?: AnimationActorComponent;
  private sprite?: Phaser.GameObjects.Sprite;
  private isVisible: boolean = true;
  private checkInterval: number = 500; // Check every 500ms
  private elapsedTime: number = 0;
  private wasAnimationPaused: boolean = false;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    onObjectReady(gameObject, this.init, this);
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init() {
    this.animationComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    if (!this.animationComponent) {
      return;
    }

    // Get the sprite from the animation component
    this.sprite = (this.animationComponent as any).sprite;
  }

  private update(_time: number, delta: number) {
    if (!this.sprite || !this.animationComponent) {
      return;
    }

    this.elapsedTime += delta;
    
    // Only check visibility at intervals to reduce performance overhead
    if (this.elapsedTime >= this.checkInterval) {
      this.elapsedTime = 0;
      this.checkVisibility();
    }
  }

  private checkVisibility() {
    if (!this.sprite) {
      return;
    }

    const camera = this.gameObject.scene.cameras.main;
    const worldView = camera.worldView;
    
    // Get sprite position in world coordinates
    let spriteX: number;
    let spriteY: number;

    if (this.gameObject instanceof Phaser.GameObjects.Container) {
      // For containers, use the container's world position
      spriteX = this.gameObject.x;
      spriteY = this.gameObject.y;
    } else if (this.sprite) {
      // For sprites, use the sprite's world position
      spriteX = this.sprite.x;
      spriteY = this.sprite.y;
    } else {
      return;
    }

    // Add a margin to prevent flickering at edges (e.g., 100 pixels)
    const margin = 100;
    const visibleRect = new Phaser.Geom.Rectangle(
      worldView.x - margin,
      worldView.y - margin,
      worldView.width + margin * 2,
      worldView.height + margin * 2
    );

    const nowVisible = Phaser.Geom.Rectangle.Contains(visibleRect, spriteX, spriteY);

    // Only update if visibility state changed
    if (nowVisible !== this.isVisible) {
      this.isVisible = nowVisible;
      
      if (this.isVisible) {
        this.resumeAnimation();
      } else {
        this.pauseAnimation();
      }
    }
  }

  private pauseAnimation() {
    if (!this.sprite || !this.sprite.anims) {
      return;
    }

    // Store the paused state before pausing
    this.wasAnimationPaused = this.sprite.anims.isPaused;
    
    // Only pause if the animation is currently playing
    if (this.sprite.anims.isPlaying && !this.wasAnimationPaused) {
      this.sprite.anims.pause();
    }
  }

  private resumeAnimation() {
    if (!this.sprite || !this.sprite.anims) {
      return;
    }

    // Only resume if we were the ones who paused it (not if it was already paused)
    if (this.sprite.anims.isPaused && !this.wasAnimationPaused) {
      this.sprite.anims.resume();
    }
  }

  private destroy() {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
