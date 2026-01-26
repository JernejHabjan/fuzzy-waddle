import type { RubbleDefinition } from "./rubble-definition";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Component that manages rubble lifecycle after building destruction
 */
export class RubbleComponent {
  private fadeTimer?: Phaser.Time.TimerEvent;
  private fadeTween?: Phaser.Tweens.Tween;

  constructor(
    private readonly gameObject: GameObject,
    public readonly rubbleDefinition: RubbleDefinition
  ) {
    // Start fade-out timer
    this.fadeTimer = gameObject.scene.time.delayedCall(rubbleDefinition.durationMs, () => {
      this.startFadeOut();
    });

    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  private startFadeOut() {
    const alphaComponent = this.gameObject as unknown as Phaser.GameObjects.Components.Alpha;
    if (!alphaComponent.setAlpha) return;

    this.fadeTween = this.gameObject.scene.tweens.add({
      targets: this.gameObject,
      alpha: 0,
      duration: this.rubbleDefinition.fadeOutDurationMs,
      ease: "Linear",
      onComplete: () => {
        this.gameObject.destroy();
      }
    });
  }

  private destroy() {
    this.fadeTimer?.remove();
    this.fadeTween?.stop();
  }
}
