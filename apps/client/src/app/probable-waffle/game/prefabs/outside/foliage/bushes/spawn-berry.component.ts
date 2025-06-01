import { getGameObjectBounds } from "../../../../data/game-object-helper";
import { DepthHelper } from "../../../../world/map/depth.helper";
import GameObject = Phaser.GameObjects.GameObject;

export class SpawnBerryComponent {
  private counter?: Phaser.Tweens.Tween;
  private squashEffectTween?: Phaser.Tweens.Tween;
  private fadeOutTween?: Phaser.Tweens.Tween;
  private berry?: Phaser.GameObjects.Sprite;
  constructor(private readonly gameObject: GameObject) {
    this.gameObject.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.spawnBerry, this);
    this.gameObject.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  private spawnBerry() {
    this.destroyTweenAndCurrentBerry(true);

    const texture = "outside";
    const frames = ["foliage/fruits/blue-fruit.png", "foliage/fruits/red-fruit.png"];
    const randomFrame = frames[Math.floor(Math.random() * frames.length)];

    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) return;

    const berry = this.gameObject.scene.add.sprite(bounds.centerX, bounds.centerY, texture, randomFrame);
    this.berry = berry;
    berry.setOrigin(0.5, 1);
    berry.setScale(0.5);
    berry.setDepth(1000); // initial depth

    const startX = bounds.centerX;
    const startY = bounds.centerY;

    // Randomize landing direction and distance
    const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI); // 360°
    const radius = Phaser.Math.Between(40, 80);

    const landX = startX + Math.cos(angle) * radius;
    const landY = startY + Math.sin(angle) * radius + Phaser.Math.Between(10, 30); // drop it lower

    const peakY = startY - Phaser.Math.Between(60, 90); // arc height
    const duration = 600;

    this.counter = this.gameObject.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: "Linear",
      onUpdate: (tween) => {
        const t = tween.getValue();
        if (!t) return;

        // Parabolic arc
        const x = Phaser.Math.Linear(startX, landX, t);
        const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * peakY + t * t * landY;

        berry.setPosition(x, y);

        // Adjust depth to match Y position
        DepthHelper.setActorDepth(berry);
      },
      onComplete: () => {
        // Optional squash effect on landing
        this.squashEffectTween = this.gameObject.scene.tweens.add({
          targets: berry,
          y: landY,
          scaleY: 0.8,
          scaleX: 1.1,
          duration: 100,
          yoyo: true,
          ease: "Quad.easeOut",
          onComplete: () => {
            // Fade out and destroy
            this.fadeOutTween = this.gameObject.scene.tweens.add({
              targets: berry,
              alpha: 0,
              duration: 400,
              onComplete: () => berry.destroy()
            });
          }
        });
      }
    });
  }

  private destroyTweenAndCurrentBerry(delay: boolean) {
    const counter = this.counter;
    const squashEffectTween = this.squashEffectTween;
    const fadeOutTween = this.fadeOutTween;
    const berry = this.berry;

    const destroy = () => {
      if (!this.gameObject.active) return;
      if (counter) {
        counter.stop();
        this.counter = undefined;
      }
      if (squashEffectTween) {
        squashEffectTween.stop();
        this.squashEffectTween = undefined;
      }
      if (fadeOutTween) {
        fadeOutTween.stop();
        this.fadeOutTween = undefined;
      }
      if (berry) {
        berry.destroy();
        this.berry = undefined;
      }
    };

    if (delay) {
      this.gameObject.scene.time.delayedCall(1000, destroy);
    } else {
      destroy();
    }
  }

  destroy() {
    if (!this.gameObject.scene) return;
    this.destroyTweenAndCurrentBerry(false);
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.gameObject.update, this);
    this.gameObject.off(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.spawnBerry, this);
  }
}
