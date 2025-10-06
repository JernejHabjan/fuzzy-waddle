import GameObject = Phaser.GameObjects.GameObject;
import { AudioActorComponent } from "../../../../../entity/components/actor-audio/audio-actor-component";
import { getActorComponent } from "../../../../../data/actor-component";
import { SoundType } from "../../../../../entity/components/actor-audio/sound-type";

export class BushRustleComponent {
  constructor(private readonly gameObject: GameObject) {
    this.gameObject.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.pointerDown, this);
    this.gameObject.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private playingTween = false;
  private tween?: Phaser.Tweens.Tween;

  private pointerDown() {
    this.rustleBush();
  }
  private rustleBush() {
    // shake the bush fast (distort the image)
    if (this.playingTween) return;
    this.playingTween = true;
    const audioActorComponent = getActorComponent(this.gameObject, AudioActorComponent);
    audioActorComponent?.playSpatialCustomSound(SoundType.Select);
    this.destroyTween();
    this.tween = this.gameObject.scene.tweens.add({
      targets: this.gameObject,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.playingTween = false;
      }
    });
  }

  private destroyTween() {
    if (this.tween) {
      this.tween.stop();
      this.tween = undefined;
    }
  }

  destroy() {
    if (!this.gameObject.scene) return;
    this.destroyTween();
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.gameObject.update, this);
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }
}
