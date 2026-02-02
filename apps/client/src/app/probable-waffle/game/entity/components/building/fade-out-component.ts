import type { FadeOutDefinition } from "./fade-out-definition";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Component that manages fade-out
 */
export class FadeOutComponent {
  private fadeTimer?: Phaser.Time.TimerEvent;
  private fadeTween?: Phaser.Tweens.Tween;

  constructor(
    private readonly gameObject: GameObject,
    public readonly fadeOutDefinition: FadeOutDefinition
  ) {
    // Start fade-out timer
    this.fadeTimer = gameObject.scene.time.delayedCall(fadeOutDefinition.durationBeforeFadeOutMs, () => {
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
      duration: this.fadeOutDefinition.fadeOutDurationMs,
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
